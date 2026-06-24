use crate::cleaner;
use crate::models::{CleanResult, DownloadEntry};
use crate::safety::{is_safe_target, resolved_roots};
use crate::scanner::{scan_paths, scan_single};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

pub fn downloads_root() -> Result<PathBuf, String> {
    let Some(downloads) = dirs::download_dir() else {
        return Err("Downloads folder not found".to_string());
    };
    if !downloads.is_dir() {
        return Err("Downloads folder not found".to_string());
    }
    Ok(downloads)
}

pub fn list_downloads_entries() -> Result<Vec<DownloadEntry>, String> {
    let root = downloads_root()?;
    let read_dir = fs::read_dir(&root).map_err(|err| format!("Downloads: {err}"))?;

    let mut folders = Vec::new();
    let mut files = Vec::new();

    for entry in read_dir.filter_map(|item| item.ok()) {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.is_empty() {
            continue;
        }

        let is_dir = path.is_dir();
        let stats = scan_single(&path);

        let item = DownloadEntry {
            path: path.to_string_lossy().to_string(),
            name,
            is_dir,
            size_bytes: stats.size_bytes,
            file_count: stats.file_count,
        };

        if is_dir {
            folders.push(item);
        } else {
            files.push(item);
        }
    }

    folders.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    let mut entries = folders;
    entries.extend(files);
    Ok(entries)
}

pub fn clean_downloads_excluding(excluded_paths: &[String]) -> CleanResult {
    let mut result = CleanResult {
        freed_bytes: 0,
        files_removed: 0,
        files_skipped_locked: 0,
        files_scheduled_reboot: 0,
        errors: vec![],
        categories_cleaned: vec![],
    };

    let root = match downloads_root() {
        Ok(root) => root,
        Err(err) => {
            result.errors.push(err);
            return result;
        }
    };

    let allowed_roots = resolved_roots(&[root.clone()]);
    if allowed_roots.is_empty() {
        result
            .errors
            .push("Downloads: could not resolve safe cleanup paths".to_string());
        return result;
    }

    let excluded = normalize_excluded_paths(excluded_paths, &root, &mut result);
    let before = scan_paths(&[root.clone()]);

    let entries: Vec<PathBuf> = match fs::read_dir(&root) {
        Ok(read_dir) => read_dir.filter_map(|e| e.ok()).map(|e| e.path()).collect(),
        Err(err) => {
            result.errors.push(format!("Downloads: {err}"));
            return result;
        }
    };

    let mut deleted_any = false;

    let entry_count = entries.len();

    for entry in entries {
        if should_exclude(&entry, &root, &excluded) {
            continue;
        }

        if !is_safe_target(&entry, &allowed_roots) {
            continue;
        }

        cleaner::clean_download_entry(&entry, &allowed_roots, &mut result);
        deleted_any = true;
    }

    let after = scan_paths(&[root]);
    let freed = before.size_bytes.saturating_sub(after.size_bytes);
    let removed = before.file_count.saturating_sub(after.file_count);

    if removed > 0 || freed > 0 {
        result.freed_bytes += freed;
        result.files_removed += removed;
        result.categories_cleaned.push("downloads_folder".to_string());
    } else if deleted_any || result.files_skipped_locked > 0 {
        result.categories_cleaned.push("downloads_folder".to_string());
    } else if excluded.len() == entry_count && entry_count > 0 {
        result
            .errors
            .push("Downloads: everything was excluded — nothing to remove".to_string());
    } else if result.errors.is_empty() {
        result.errors.push(
            "Downloads: no files removed (some may be in use by other apps)".to_string(),
        );
    }

    result
}

fn normalize_excluded_paths(
    excluded_paths: &[String],
    root: &Path,
    result: &mut CleanResult,
) -> HashSet<PathBuf> {
    let mut excluded = HashSet::new();

    for raw in excluded_paths {
        let path = PathBuf::from(raw);
        match validate_top_level_downloads_path(&path, root) {
            Ok(normalized) => {
                excluded.insert(normalized);
            }
            Err(err) => {
                if result.errors.len() < 5 {
                    result.errors.push(err);
                }
            }
        }
    }

    excluded
}

pub fn validate_top_level_downloads_path(path: &Path, root: &Path) -> Result<PathBuf, String> {
    let root = root
        .canonicalize()
        .unwrap_or_else(|_| root.to_path_buf());
    let resolved = path
        .canonicalize()
        .unwrap_or_else(|_| path.to_path_buf());

    if !crate::safety::is_safe_target(&resolved, &[root.clone()]) {
        return Err("Downloads exclude path is outside the Downloads folder".to_string());
    }

    let parent = resolved
        .parent()
        .ok_or_else(|| "Downloads exclude path has no parent".to_string())?;
    let root_normalized = root.to_string_lossy().to_lowercase();
    let parent_normalized = parent
        .canonicalize()
        .unwrap_or_else(|_| parent.to_path_buf())
        .to_string_lossy()
        .to_lowercase();

    if parent_normalized != root_normalized {
        return Err("Only top-level Downloads items can be excluded".to_string());
    }

    Ok(resolved)
}

fn should_exclude(entry: &Path, root: &Path, excluded: &HashSet<PathBuf>) -> bool {
    let Ok(normalized) = validate_top_level_downloads_path(entry, root) else {
        return false;
    };

    excluded.iter().any(|path| paths_equal(path, &normalized))
}

fn paths_equal(a: &Path, b: &Path) -> bool {
    a.canonicalize()
        .unwrap_or_else(|_| a.to_path_buf())
        .to_string_lossy()
        .to_lowercase()
        == b.canonicalize()
            .unwrap_or_else(|_| b.to_path_buf())
            .to_string_lossy()
            .to_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_downloads_entries_does_not_panic() {
        let _ = list_downloads_entries();
    }
}
