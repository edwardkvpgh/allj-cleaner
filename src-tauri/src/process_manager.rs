use crate::models::{CloseAppsResult, InterferenceApp, LockingApp};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

const DETECT_TIMEOUT: Duration = Duration::from_secs(3);
const INTERFERENCE_TIMEOUT: Duration = Duration::from_secs(8);

#[cfg(windows)]
mod windows_impl {
    use super::{CloseAppsResult, InterferenceApp, LockingApp, DETECT_TIMEOUT, INTERFERENCE_TIMEOUT};
    use std::collections::{HashMap, HashSet};
    use std::time::Duration;
    use std::mem::zeroed;
    use std::os::windows::ffi::OsStrExt;
    use std::os::windows::process::CommandExt;
    use std::path::{Path, PathBuf};
    use std::process::Command;
    use std::sync::mpsc;
    use std::thread;
    use windows_sys::Win32::Foundation::{CloseHandle, ERROR_MORE_DATA, WIN32_ERROR};
    use windows_sys::Win32::System::RestartManager::{
        RmEndSession, RmGetList, RmRegisterResources, RmStartSession, CCH_RM_MAX_APP_NAME,
        CCH_RM_SESSION_KEY,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, TerminateProcess, PROCESS_TERMINATE,
    };

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    pub fn find_locking_apps(paths: &[PathBuf], category_ids: &[String]) -> Vec<LockingApp> {
        let existing: Vec<PathBuf> = paths.iter().filter(|p| p.exists()).cloned().collect();
        if existing.is_empty() {
            return vec![];
        }

        let needs_browser_check = category_ids
            .iter()
            .any(|id| crate::paths::category_needs_browser_check(id))
            || category_ids.iter().any(|id| id == "user_temp");
        let needs_temp_check = category_ids.iter().any(|id| id == "user_temp");

        let mut apps = Vec::new();

        let existing_paths = existing.clone();
        if let Ok(Ok(rm_apps)) =
            run_with_timeout(move || find_with_restart_manager(&existing_paths))
        {
            apps.extend(rm_apps);
        }

        if needs_browser_check {
            if let Ok(browser_apps) = run_with_timeout(find_browser_apps) {
                apps.extend(browser_apps);
            }
        }

        if needs_temp_check {
            if let Ok(bg_apps) = run_with_timeout(find_temp_blocking_apps) {
                apps.extend(bg_apps);
            }
        }

        group_apps_for_display(dedupe_apps(apps))
    }

    pub fn find_interference_apps(paths: &[PathBuf], category_ids: &[String]) -> Vec<InterferenceApp> {
        let existing: Vec<PathBuf> = paths.iter().filter(|p| p.exists()).cloned().collect();

        let needs_browser_check = category_ids
            .iter()
            .any(|id| crate::paths::category_needs_browser_check(id))
            || category_ids.iter().any(|id| id == "user_temp");
        let needs_temp_check = category_ids.iter().any(|id| id == "user_temp");

        let mut apps = Vec::new();
        let mut locking_pids = HashSet::new();

        if needs_temp_check && !existing.is_empty() {
            let existing_paths = existing.clone();
            if let Ok(Ok(rm_apps)) =
                run_with_timeout_ms(INTERFERENCE_TIMEOUT, move || {
                    find_with_restart_manager(&existing_paths)
                })
            {
                for app in &rm_apps {
                    locking_pids.insert(app.pid);
                    for pid in &app.pids {
                        locking_pids.insert(*pid);
                    }
                }
                apps.extend(rm_apps);
            }
        }

        if needs_browser_check {
            if let Ok(browser_apps) = run_with_timeout(find_browser_apps_all) {
                apps.extend(browser_apps);
            }
        }

        if needs_temp_check {
            if let Ok(bg_apps) = run_with_timeout(find_interference_candidates) {
                apps.extend(bg_apps);
            }
        }

        to_interference_apps(apps, &locking_pids)
    }

    pub fn find_cleanup_interference_apps() -> Vec<LockingApp> {
        let mut apps = Vec::new();

        if let Ok(browser_apps) = run_with_timeout(find_browser_apps) {
            apps.extend(browser_apps);
        }

        if let Ok(bg_apps) = run_with_timeout(find_temp_blocking_apps) {
            apps.extend(bg_apps);
        }

        group_apps_for_display(dedupe_apps(apps))
    }

    pub fn force_close_apps(apps: &[LockingApp]) -> CloseAppsResult {
        let mut closed = Vec::new();
        let mut failed = Vec::new();

        for app in apps {
            if is_protected(&app.name, app.pid) {
                failed.push(format!("{}: protected process", app.name));
                continue;
            }

            match close_app(app) {
                Ok(()) => closed.push(app.clone()),
                Err(err) => failed.push(format!("{}: {err}", app.name)),
            }
        }

        CloseAppsResult { closed, failed }
    }

    fn run_with_timeout<T: Send + 'static>(
        task: impl FnOnce() -> T + Send + 'static,
    ) -> Result<T, ()> {
        run_with_timeout_ms(DETECT_TIMEOUT, task)
    }

    fn run_with_timeout_ms<T: Send + 'static>(
        timeout: Duration,
        task: impl FnOnce() -> T + Send + 'static,
    ) -> Result<T, ()> {
        let (tx, rx) = mpsc::channel();
        thread::spawn(move || {
            let _ = tx.send(task());
        });
        rx.recv_timeout(timeout).map_err(|_| ())
    }

    fn dedupe_apps(apps: Vec<LockingApp>) -> Vec<LockingApp> {
        dedupe_apps_raw(apps)
            .into_iter()
            .filter(|app| !is_protected(&app.name, app.pid))
            .collect()
    }

    fn dedupe_apps_raw(apps: Vec<LockingApp>) -> Vec<LockingApp> {
        let mut unique = HashMap::new();
        for app in apps {
            if app.pid == 0 {
                continue;
            }
            unique.insert(app.pid, app);
        }
        unique.into_values().collect()
    }

    fn to_interference_apps(
        apps: Vec<LockingApp>,
        locking_pids: &HashSet<u32>,
    ) -> Vec<InterferenceApp> {
        let mut grouped = group_apps_for_display(dedupe_apps_raw(apps));
        grouped.sort_by(|a, b| {
            let a_lock = a.pids.iter().any(|pid| locking_pids.contains(pid))
                || locking_pids.contains(&a.pid);
            let b_lock = b.pids.iter().any(|pid| locking_pids.contains(pid))
                || locking_pids.contains(&b.pid);
            b_lock.cmp(&a_lock).then_with(|| {
                let a_close = !is_protected(&a.name, a.pid);
                let b_close = !is_protected(&b.name, b.pid);
                b_close.cmp(&a_close)
            })
        });

        grouped
            .into_iter()
            .map(|app| {
                let holding_lock = app.pids.iter().any(|pid| locking_pids.contains(pid))
                    || locking_pids.contains(&app.pid);
                InterferenceApp {
                    closeable: !is_protected(&app.name, app.pid),
                    holding_lock,
                    pid: app.pid,
                    name: app.name,
                    process_count: app.process_count,
                    pids: app.pids,
                }
            })
            .collect()
    }

    fn group_apps_for_display(apps: Vec<LockingApp>) -> Vec<LockingApp> {
        let mut groups: HashMap<String, Vec<LockingApp>> = HashMap::new();

        for app in apps {
            groups
                .entry(app.name.to_lowercase())
                .or_default()
                .push(app);
        }

        let mut grouped: Vec<LockingApp> = groups
            .into_values()
            .map(|mut items| {
                items.sort_by_key(|app| app.pid);
                let pids: Vec<u32> = items.iter().map(|app| app.pid).collect();
                LockingApp {
                    pid: pids[0],
                    name: items[0].name.clone(),
                    process_count: pids.len() as u32,
                    pids,
                }
            })
            .collect();

        grouped.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        grouped
    }

    fn find_with_restart_manager(paths: &[PathBuf]) -> Result<Vec<LockingApp>, WIN32_ERROR> {
        let mut session = 0u32;
        let mut session_key = [0u16; (CCH_RM_SESSION_KEY + 1) as usize];

        let start = unsafe { RmStartSession(&mut session, 0, session_key.as_mut_ptr()) };
        if start != 0 {
            return Err(start);
        }

        let wide_paths: Vec<Vec<u16>> = paths.iter().map(|p| path_to_wide(p)).collect();
        let path_ptrs: Vec<*const u16> = wide_paths.iter().map(|p| p.as_ptr()).collect();

        let register = unsafe {
            RmRegisterResources(
                session,
                path_ptrs.len() as u32,
                path_ptrs.as_ptr(),
                0,
                std::ptr::null(),
                0,
                std::ptr::null(),
            )
        };

        if register != 0 {
            unsafe { RmEndSession(session) };
            return Err(register);
        }

        let mut needed = 0u32;
        let mut count = 0u32;
        let mut reboot_reasons = 0u32;

        let first = unsafe {
            RmGetList(
                session,
                &mut needed,
                &mut count,
                std::ptr::null_mut(),
                &mut reboot_reasons,
            )
        };

        if first != 0 && first != ERROR_MORE_DATA {
            unsafe { RmEndSession(session) };
            return Err(first);
        }

        if needed == 0 {
            unsafe { RmEndSession(session) };
            return Ok(vec![]);
        }

        let mut processes = vec![unsafe { zeroed() }; needed as usize];
        count = needed;

        let second = unsafe {
            RmGetList(
                session,
                &mut needed,
                &mut count,
                processes.as_mut_ptr(),
                &mut reboot_reasons,
            )
        };

        unsafe { RmEndSession(session) };

        if second != 0 {
            return Err(second);
        }

        let mut unique = HashMap::new();
        for info in processes.iter().take(count as usize) {
            let name = wide_to_string(&info.strAppName);
            let pid = info.Process.dwProcessId;
            if pid == 0 {
                continue;
            }
            unique.entry(pid).or_insert(LockingApp {
                pid,
                name,
                process_count: 1,
                pids: vec![],
            });
        }

        Ok(unique.into_values().collect())
    }

    fn find_browser_apps() -> Vec<LockingApp> {
        run_process_query(
            r#"Get-Process chrome,msedge,firefox,brave -ErrorAction SilentlyContinue |
                Select-Object Id, ProcessName -Unique |
                ConvertTo-Json -Compress"#,
        )
    }

    fn find_browser_apps_all() -> Vec<LockingApp> {
        run_process_query_all(
            r#"Get-Process chrome,msedge,firefox,brave,msedgewebview2 -ErrorAction SilentlyContinue |
                Select-Object Id, ProcessName -Unique |
                ConvertTo-Json -Compress"#,
        )
    }

    fn find_temp_blocking_apps() -> Vec<LockingApp> {
        run_process_query(
            r#"Get-Process | Where-Object {
                    $_.ProcessName -match '^(chrome|msedge|firefox|brave|OneDrive|Adobe|Acrobat|WINWORD|EXCEL|POWERPNT|OUTLOOK|Teams|Discord|Spotify|steam|EpicGamesLauncher|Zoom|slack|Dropbox|GoogleDriveFS)$'
                } | Select-Object Id, ProcessName -Unique |
                ConvertTo-Json -Compress"#,
        )
    }

    fn find_interference_candidates() -> Vec<LockingApp> {
        run_process_query_all(
            r#"Get-Process | Where-Object {
                    $_.ProcessName -match '^(chrome|msedge|msedgewebview2|firefox|brave|OneDrive|Adobe|Acrobat|AcroCEF|WINWORD|EXCEL|POWERPNT|OUTLOOK|Teams|ms-teams|Discord|Spotify|steam|EpicGamesLauncher|Zoom|slack|Dropbox|GoogleDriveFS|Cursor|Code|devenv|idea64|java|javaw|python|node|Docker Desktop|com.docker.backend|Everything|nvcontainer|Unity|UnrealEngine|notepad|Notepad|explorer|SearchHost|SearchIndexer|RuntimeBroker|dllhost|taskhostw|WidgetService|msedgewebview2|ApplicationFrameHost|PhoneExperienceHost|ShellExperienceHost)$'
                } | Select-Object Id, ProcessName -Unique |
                ConvertTo-Json -Compress"#,
        )
    }

    fn run_process_query(script: &str) -> Vec<LockingApp> {
        let output = match powershell_output(script) {
            Some(output) => output,
            None => return vec![],
        };

        parse_process_json(&output, true)
    }

    fn run_process_query_all(script: &str) -> Vec<LockingApp> {
        let output = match powershell_output(script) {
            Some(output) => output,
            None => return vec![],
        };

        parse_process_json(&output, false)
    }

    fn powershell_output(script: &str) -> Option<String> {
        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if text.is_empty() {
            None
        } else {
            Some(text)
        }
    }

    fn parse_process_json(json: &str, filter_protected: bool) -> Vec<LockingApp> {
        let trimmed = json.trim();
        if trimmed.is_empty() {
            return vec![];
        }

        if let Ok(list) = serde_json::from_str::<Vec<serde_json::Value>>(trimmed) {
            return list
                .iter()
                .filter_map(|item| {
                    Some(LockingApp {
                        pid: item
                            .get("Id")
                            .or_else(|| item.get("pid"))
                            .and_then(|v| v.as_u64())? as u32,
                        name: item
                            .get("ProcessName")
                            .or_else(|| item.get("name"))
                            .and_then(|v| v.as_str())?
                            .to_string(),
                        process_count: 1,
                        pids: vec![],
                    })
                })
                .filter(|app| {
                    !filter_protected || !is_protected(&app.name, app.pid)
                })
                .collect();
        }

        if let Ok(item) = serde_json::from_str::<serde_json::Value>(trimmed) {
            if let (Some(pid), Some(name)) = (
                item.get("Id")
                    .or_else(|| item.get("pid"))
                    .and_then(|p| p.as_u64()),
                item.get("ProcessName")
                    .or_else(|| item.get("name"))
                    .and_then(|n| n.as_str()),
            ) {
                let app = LockingApp {
                    pid: pid as u32,
                    name: name.to_string(),
                    process_count: 1,
                    pids: vec![],
                };
                if !filter_protected || !is_protected(&app.name, app.pid) {
                    return vec![app];
                }
            }
        }

        vec![]
    }

    fn close_app(app: &LockingApp) -> Result<(), String> {
        if is_protected(&app.name, app.pid) {
            return Err("protected system process".into());
        }

        if is_browser(&app.name) {
            return taskkill_by_image(&app.name);
        }

        if app.pids.len() > 1 {
            let mut last_error = None;
            for pid in &app.pids {
                if let Err(err) = terminate_process(*pid) {
                    last_error = Some(err);
                }
            }
            return last_error.map_or(Ok(()), Err);
        }

        terminate_process(app.pid)
    }

    fn is_browser(name: &str) -> bool {
        let normalized = name.to_lowercase();
        let base = normalized.trim_end_matches(".exe");
        matches!(base, "chrome" | "msedge" | "firefox" | "brave")
    }

    fn taskkill_by_image(name: &str) -> Result<(), String> {
        let image = {
            let normalized = name.to_lowercase();
            if normalized.ends_with(".exe") {
                normalized
            } else {
                format!("{normalized}.exe")
            }
        };

        let output = Command::new("taskkill")
            .args(["/F", "/IM", &image])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|err| err.to_string())?;

        if output.status.success() {
            return Ok(());
        }

        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if stderr.contains("not found") {
            return Err("process not found".into());
        }

        Err(if stderr.is_empty() {
            "taskkill failed".into()
        } else {
            stderr
        })
    }

    fn terminate_process(pid: u32) -> Result<(), String> {
        unsafe {
            let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
            if handle.is_null() {
                return Err("could not open process".into());
            }

            let ok = TerminateProcess(handle, 1);
            CloseHandle(handle);

            if ok == 0 {
                return Err("terminate failed".into());
            }
        }

        Ok(())
    }

    fn path_to_wide(path: &Path) -> Vec<u16> {
        path.as_os_str()
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }

    fn wide_to_string(buffer: &[u16; (CCH_RM_MAX_APP_NAME + 1) as usize]) -> String {
        let len = buffer.iter().position(|&c| c == 0).unwrap_or(buffer.len());
        String::from_utf16_lossy(&buffer[..len])
    }

    const PROTECTED_NAMES: &[&str] = &[
        "system",
        "registry",
        "smss",
        "csrss",
        "wininit",
        "services",
        "lsass",
        "svchost",
        "explorer",
        "dwm",
        "winlogon",
        "allj-cleaner",
        "tauri-app",
        "cursor",
        "code",
        "runtimebroker",
        "searchhost",
        "searchindexer",
        "searchprotocolhost",
        "sihost",
        "taskhostw",
        "dllhost",
        "msiexec",
        "node",
        "python",
        "java",
        "powershell",
        "pwsh",
        "cmd",
        "conhost",
        "fontdrvhost",
        "applicationframehost",
        "widgetservice",
        "securityhealthservice",
        "shellexperiencehost",
        "startmenuexperiencehost",
        "phoneexperiencehost",
        "textinputhost",
        "systemsettings",
        "lockapp",
        "ctfmon",
        "msedgewebview2",
    ];

    fn is_protected(name: &str, pid: u32) -> bool {
        if pid <= 4 {
            return true;
        }

        let base = process_basename(name);
        let full = name.to_lowercase();

        if PROTECTED_NAMES.iter().any(|p| base == *p) {
            return true;
        }

        if full == "windows explorer"
            || full == "file explorer"
            || full.contains("shell experience")
            || full.contains("start menu experience")
        {
            return true;
        }

        false
    }

    fn process_basename(name: &str) -> String {
        let normalized = name.to_lowercase().trim_end_matches(".exe").to_string();

        if normalized.contains('\\') || normalized.contains('/') {
            Path::new(&normalized)
                .file_name()
                .map(|segment| segment.to_string_lossy().to_lowercase())
                .unwrap_or(normalized)
        } else {
            normalized
        }
    }
}

#[cfg(windows)]
pub use windows_impl::{
    find_cleanup_interference_apps, find_interference_apps, find_locking_apps, force_close_apps,
};

#[cfg(not(windows))]
pub fn find_interference_apps(_paths: &[PathBuf], _category_ids: &[String]) -> Vec<InterferenceApp> {
    vec![]
}

#[cfg(not(windows))]
pub fn find_cleanup_interference_apps() -> Vec<LockingApp> {
    vec![]
}

#[cfg(not(windows))]
pub fn find_locking_apps(_paths: &[PathBuf], _category_ids: &[String]) -> Vec<LockingApp> {
    vec![]
}

#[cfg(not(windows))]
pub fn force_close_apps(_apps: &[LockingApp]) -> CloseAppsResult {
    CloseAppsResult {
        closed: vec![],
        failed: vec!["Force close is only supported on Windows".into()],
    }
}

pub fn interference_apps_for_categories(category_ids: &[String]) -> Vec<InterferenceApp> {
    use crate::paths::{category_skips_locking_paths, resolve_category_paths};

    let (tx, rx) = mpsc::channel();
    let ids = category_ids.to_vec();
    thread::spawn(move || {
        let mut paths = Vec::new();
        for id in &ids {
            if category_skips_locking_paths(id) {
                continue;
            }
            paths.extend(resolve_category_paths(id));
        }
        let apps = find_interference_apps(&paths, &ids);
        let _ = tx.send(apps);
    });

    rx.recv_timeout(INTERFERENCE_TIMEOUT)
        .unwrap_or_default()
}

pub fn locking_apps_for_categories(category_ids: &[String]) -> Vec<LockingApp> {
    use crate::paths::{category_skips_locking_paths, resolve_category_paths};

    let (tx, rx) = mpsc::channel();
    let ids = category_ids.to_vec();
    thread::spawn(move || {
        let mut paths = Vec::new();
        for id in &ids {
            if category_skips_locking_paths(id) {
                continue;
            }
            paths.extend(resolve_category_paths(id));
        }
        let apps = find_locking_apps(&paths, &ids);
        let _ = tx.send(apps);
    });

    rx.recv_timeout(DETECT_TIMEOUT).unwrap_or_default()
}

pub fn pre_scan_interference_apps() -> Vec<LockingApp> {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let apps = find_cleanup_interference_apps();
        let _ = tx.send(apps);
    });

    rx.recv_timeout(DETECT_TIMEOUT).unwrap_or_default()
}
