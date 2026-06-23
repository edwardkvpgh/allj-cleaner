mod cleaner;
mod clipboard;
mod models;
mod paths;
mod process_manager;
mod reboot_delete;
mod recycle_bin;
mod safety;
mod scanner;
mod single_instance;

use models::{CleanResult, CloseAppsResult, InterferenceApp, LockingApp, ScanCategory};
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
fn clean_selected(category_ids: Vec<String>) -> CleanResult {
    cleaner::clean_categories(&category_ids)
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
            get_pre_scan_apps,
            get_interference_apps,
            get_locking_apps,
            force_close_apps
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
