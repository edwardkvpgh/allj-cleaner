use crate::clipboard;
use crate::models::CleanResult;
use crate::paths::resolve_category_paths;
use crate::reboot_delete;
use crate::recycle_bin;
use crate::safety::{is_safe_target, resolved_roots};
use crate::scanner::scan_paths;
use std::fs;
use std::path::{Path, PathBuf};
use std::thread;
use std::time::Duration;
use walkdir::WalkDir;

const DELETE_RETRIES: u32 = 3;
const RETRY_DELAY_MS: u64 = 80;

pub fn clean_categories(category_ids: &[String]) -> CleanResult {
    let mut result = CleanResult {
        freed_bytes: 0,
        files_removed: 0,
        files_skipped_locked: 0,
        files_scheduled_reboot: 0,
        errors: vec![],
        categories_cleaned: vec![],
    };

    for id in category_ids {
        if id == "recycle_bin" {
            match recycle_bin::empty() {
                Ok(stats) if stats.file_count > 0 || stats.size_bytes > 0 => {
                    result.freed_bytes += stats.size_bytes;
                    result.files_removed += stats.file_count;
                    result.categories_cleaned.push(id.clone());
                }
                Ok(_) => {}
                Err(err) => result.errors.push(format!("Recycle Bin: {err}")),
            }
            continue;
        }

        if id == "clipboard" {
            match clipboard::clear() {
                Ok(stats) if stats.file_count > 0 || stats.size_bytes > 0 => {
                    result.freed_bytes += stats.size_bytes;
                    result.files_removed += stats.file_count;
                    result.categories_cleaned.push(id.clone());
                }
                Ok(_) => {}
                Err(err) => result.errors.push(format!("Clipboard: {err}")),
            }
            continue;
        }

        let paths = resolve_category_paths(id);
        if paths.is_empty() {
            continue;
        }

        let before = scan_paths(&paths);
        if before.file_count == 0 && before.size_bytes == 0 {
            continue;
        }

        let allowed_roots = resolved_roots(&paths);
        if allowed_roots.is_empty() {
            result
                .errors
                .push(format!("{id}: could not resolve safe cleanup paths"));
            continue;
        }

        clean_paths(&paths, &allowed_roots, &mut result);

        let after = scan_paths(&paths);
        let freed = before.size_bytes.saturating_sub(after.size_bytes);
        let removed = before.file_count.saturating_sub(after.file_count);

        if removed > 0 || freed > 0 {
            result.freed_bytes += freed;
            result.files_removed += removed;
            result.categories_cleaned.push(id.clone());
        } else if result.files_skipped_locked > 0 {
            result.categories_cleaned.push(id.clone());
        } else if result.errors.is_empty() {
            result.errors.push(format!(
                "{id}: no files removed (some may be in use by other apps)"
            ));
        }
    }

    result
}

fn clean_paths(paths: &[PathBuf], allowed_roots: &[PathBuf], result: &mut CleanResult) {
    for path in paths {
        if !path.exists() {
            continue;
        }

        if path.is_file() {
            try_remove_file(path, allowed_roots, result);
            continue;
        }

        let entries: Vec<PathBuf> = match fs::read_dir(path) {
            Ok(read_dir) => read_dir.filter_map(|e| e.ok()).map(|e| e.path()).collect(),
            Err(err) => {
                push_error(result, format!("{}: {err}", path.display()));
                continue;
            }
        };

        for entry in entries {
            clean_entry(&entry, allowed_roots, result);
        }
    }
}

fn clean_entry(entry: &Path, allowed_roots: &[PathBuf], result: &mut CleanResult) {
    if !is_safe_target(entry, allowed_roots) {
        return;
    }

    if entry.is_file() {
        try_remove_file(entry, allowed_roots, result);
        return;
    }

    if entry.is_dir() {
        if fs::remove_dir_all(entry).is_ok() {
            return;
        }

        for child in WalkDir::new(entry)
            .contents_first(true)
            .into_iter()
            .filter_map(|e| e.ok())
            .skip(1)
        {
            let child_path = child.path();
            if !is_safe_target(child_path, allowed_roots) {
                continue;
            }
            if child.file_type().is_dir() {
                let _ = fs::remove_dir(child_path);
            } else {
                try_remove_file(child_path, allowed_roots, result);
            }
        }

        let _ = fs::remove_dir(entry);
    }
}

fn try_remove_file(path: &Path, allowed_roots: &[PathBuf], result: &mut CleanResult) {
    if !is_safe_target(path, allowed_roots) {
        return;
    }

    for attempt in 0..DELETE_RETRIES {
        match fs::remove_file(path) {
            Ok(()) => return,
            Err(err) if is_file_in_use(&err) && attempt + 1 < DELETE_RETRIES => {
                thread::sleep(Duration::from_millis(RETRY_DELAY_MS));
            }
            Err(err) => {
                if is_file_in_use(&err) {
                    result.files_skipped_locked += 1;
                    if reboot_delete::schedule_delete_on_reboot(path) {
                        result.files_scheduled_reboot += 1;
                    }
                } else {
                    push_error(result, format!("{}: {err}", path.display()));
                }
            }
        }
    }
}

fn is_file_in_use(err: &std::io::Error) -> bool {
    if matches!(err.raw_os_error(), Some(32) | Some(33) | Some(5)) {
        return true;
    }

    let message = err.to_string().to_lowercase();
    message.contains("being used by another process")
        || message.contains("os error 32")
        || message.contains("os error 33")
        || message.contains("access is denied")
        || err.kind() == std::io::ErrorKind::PermissionDenied
}

fn push_error(result: &mut CleanResult, message: String) {
    if result.errors.len() < 5 {
        result.errors.push(message);
    }
}
