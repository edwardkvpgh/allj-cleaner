mod cleaner;
mod clipboard;
mod downloads;
mod models;
mod paths;
mod process_manager;
mod reboot_delete;
mod recycle_bin;
mod safety;
mod scanner;
mod single_instance;
mod system_clean;

use models::{CleanResult, CloseAppsResult, DownloadEntry, InterferenceApp, LockingApp, ScanCategory};
use paths::{resolve_category_paths, CATEGORIES};
use scanner::scan_paths;

fn scan_category(def_id: &str, resolved: &[std::path::PathBuf]) -> scanner::ScanStats {
    if def_id == "recycle_bin" {
        return recycle_bin::scan();
    }

    if def_id == "clipboard" {
        return clipboard::scan();
    }

    if resolved.is_empty() || !resolved.iter().any(|p| p.exists()) {
        scanner::ScanStats::default()
    } else {
        scan_paths(resolved)
    }
}

fn category_available(def_id: &str, resolved: &[std::path::PathBuf]) -> bool {
    if def_id == "recycle_bin" || def_id == "clipboard" {
        return true;
    }
    if def_id == "dns_cache" {
        return paths::is_action_category(def_id) && cfg!(windows);
    }
    if paths::is_browser_privacy_category(def_id) {
        return paths::browser_privacy_installed(def_id);
    }
    !resolved.is_empty() && resolved.iter().any(|p| p.exists())
}

#[tauri::command]
fn scan_all() -> Vec<ScanCategory> {
    let mut results: Vec<ScanCategory> = CATEGORIES
        .iter()
        .map(|def| {
            let resolved = resolve_category_paths(def.id);
            let available = category_available(def.id, &resolved);
            let stats = scan_category(def.id, &resolved);

            ScanCategory {
                id: def.id.to_string(),
                name: def.name.to_string(),
                description: def.description.to_string(),
                emoji: def.emoji.to_string(),
                size_bytes: stats.size_bytes,
                file_count: stats.file_count,
                paths: if def.id == "recycle_bin" {
                    vec!["Recycle Bin".to_string()]
                } else if def.id == "clipboard" {
                    vec!["Windows Clipboard".to_string()]
                } else if def.id == "dns_cache" {
                    vec!["Windows DNS resolver cache".to_string()]
                } else {
                    resolved
                        .iter()
                        .map(|p| p.to_string_lossy().to_string())
                        .collect()
                },
                available,
                warning: def.warning.map(str::to_string),
            }
        })
        .collect();

    results.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    results
}

#[tauri::command]
fn clean_selected(
    category_ids: Vec<String>,
    excluded_download_paths: Option<Vec<String>>,
) -> CleanResult {
    cleaner::clean_categories(
        &category_ids,
        excluded_download_paths.as_deref().unwrap_or(&[]),
    )
}

#[tauri::command]
fn list_downloads_entries() -> Result<Vec<DownloadEntry>, String> {
    downloads::list_downloads_entries()
}

#[tauri::command]
fn get_pre_scan_apps() -> Vec<LockingApp> {
    process_manager::pre_scan_interference_apps()
}

#[tauri::command]
fn get_interference_apps(category_ids: Vec<String>) -> Vec<InterferenceApp> {
    process_manager::interference_apps_for_categories(&category_ids)
}

#[tauri::command]
fn get_locking_apps(category_ids: Vec<String>) -> Vec<LockingApp> {
    process_manager::locking_apps_for_categories(&category_ids)
}

#[tauri::command]
fn force_close_apps(apps: Vec<LockingApp>) -> CloseAppsResult {
    process_manager::force_close_apps(&apps)
}

#[tauri::command]
fn open_downloads_in_explorer() -> Result<(), String> {
    paths::open_downloads_in_explorer()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::paths::{resolve_category_paths, CATEGORIES};

    #[test]
    fn scan_all_does_not_panic() {
        let results = scan_all();
        assert!(!results.is_empty());
    }

    #[test]
    fn scan_each_category_individually() {
        for def in CATEGORIES {
            let resolved = resolve_category_paths(def.id);
            let _stats = scan_category(def.id, &resolved);
            eprintln!("scanned {}", def.id);
        }
    }

    #[test]
    fn clipboard_scan_does_not_corrupt_heap() {
        let stats = clipboard::scan();
        eprintln!("clipboard scan: {} bytes, {} items", stats.size_bytes, stats.file_count);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if !single_instance::acquire_or_prompt() {
        return;
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_all,
            clean_selected,
            list_downloads_entries,
            get_pre_scan_apps,
            get_interference_apps,
            get_locking_apps,
            force_close_apps,
            open_downloads_in_explorer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
