use std::path::{Path, PathBuf};

pub struct CategoryDef {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub emoji: &'static str,
    pub warning: Option<&'static str>,
}

const PRIVACY_SIGN_OUT_WARNING: &str =
    "Close the browser first — you will be signed out of websites. Saved passwords are not removed.";

pub const CATEGORIES: &[CategoryDef] = &[
    CategoryDef {
        id: "user_temp",
        name: "User Temp Files",
        description: "Random temp clutter from apps you forgot existed",
        emoji: "🗑️",
        warning: Some("Close other apps first — locked files can't be deleted until they're free"),
    },
    CategoryDef {
        id: "recycle_bin",
        name: "Recycle Bin",
        description: "Stuff you \"deleted\" but never actually yeeted",
        emoji: "♻️",
        warning: None,
    },
    CategoryDef {
        id: "chrome_cache",
        name: "Chrome Cache",
        description: "Browser cache — close Chrome first for max gains",
        emoji: "🌐",
        warning: Some("Close Google Chrome before cleaning for best results"),
    },
    CategoryDef {
        id: "edge_cache",
        name: "Edge Cache",
        description: "Microsoft Edge cache taking up your vibe storage",
        emoji: "🔷",
        warning: Some("Close Microsoft Edge before cleaning for best results"),
    },
    CategoryDef {
        id: "firefox_cache",
        name: "Firefox Cache",
        description: "Firefox cache and startup artifacts from all profiles",
        emoji: "🦊",
        warning: Some("Close Mozilla Firefox before cleaning for best results"),
    },
    CategoryDef {
        id: "brave_cache",
        name: "Brave Cache",
        description: "Brave browser cache from all profiles",
        emoji: "🦁",
        warning: Some("Close Brave before cleaning for best results"),
    },
    CategoryDef {
        id: "clipboard",
        name: "Clipboard",
        description: "Copied text and images sitting in your paste buffer",
        emoji: "📋",
        warning: Some(
            "Clears Ctrl+V paste buffer and Win+V history when possible — open Win+V and tap Clear all if images linger",
        ),
    },
    CategoryDef {
        id: "chrome_cookies",
        name: "Chrome — Cookies & Sessions",
        description: "Site logins and saved tab/session restore data",
        emoji: "🍪",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "chrome_history",
        name: "Chrome — History & Downloads List",
        description: "URLs you visited and items shown in chrome://downloads",
        emoji: "📜",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "chrome_site_storage",
        name: "Chrome — Site Storage",
        description: "Local storage, IndexedDB, and session storage per site",
        emoji: "💾",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "edge_cookies",
        name: "Edge — Cookies & Sessions",
        description: "Site logins and saved tab/session restore data",
        emoji: "🍪",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "edge_history",
        name: "Edge — History & Downloads List",
        description: "URLs you visited and items shown in edge://downloads",
        emoji: "📜",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "edge_site_storage",
        name: "Edge — Site Storage",
        description: "Local storage, IndexedDB, and session storage per site",
        emoji: "💾",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "brave_cookies",
        name: "Brave — Cookies & Sessions",
        description: "Site logins and saved tab/session restore data",
        emoji: "🍪",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "brave_history",
        name: "Brave — History & Downloads List",
        description: "URLs you visited and items shown in brave://downloads",
        emoji: "📜",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "brave_site_storage",
        name: "Brave — Site Storage",
        description: "Local storage, IndexedDB, and session storage per site",
        emoji: "💾",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "firefox_cookies",
        name: "Firefox — Cookies & Sessions",
        description: "Site logins and Firefox session restore artifacts",
        emoji: "🍪",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "firefox_history",
        name: "Firefox — History & Downloads List",
        description: "URLs and download history stored in places.sqlite",
        emoji: "📜",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "firefox_site_storage",
        name: "Firefox — Site Storage",
        description: "Firefox storage folders for site data",
        emoji: "💾",
        warning: Some(PRIVACY_SIGN_OUT_WARNING),
    },
    CategoryDef {
        id: "downloads_folder",
        name: "Downloads Folder",
        description: "Files in your Downloads folder (high impact, review carefully)",
        emoji: "⬇️",
        warning: Some("Optional and high impact — confirmation required; never included in secure exit"),
    },
    CategoryDef {
        id: "dns_cache",
        name: "DNS Cache",
        description: "Windows resolver cache of recent domain lookups",
        emoji: "🌐",
        warning: Some("Flushes local DNS lookups — does not sign you out of websites"),
    },
    CategoryDef {
        id: "thumbnail_cache",
        name: "Thumbnail Cache",
        description: "Windows Explorer previews of images and files you've opened",
        emoji: "🖼️",
        warning: Some(
            "Never close File Explorer for this — locked files are queued for restart instead",
        ),
    },
    CategoryDef {
        id: "teams_cache",
        name: "Teams Cache",
        description: "Microsoft Teams app cache and temporary blobs",
        emoji: "💬",
        warning: Some("Close Teams before cleaning for best results"),
    },
    CategoryDef {
        id: "discord_cache",
        name: "Discord Cache",
        description: "Discord app cache, code cache, and GPU cache",
        emoji: "🎧",
        warning: Some("Close Discord before cleaning for best results"),
    },
    CategoryDef {
        id: "spotify_cache",
        name: "Spotify Cache",
        description: "Spotify temporary media/cache storage",
        emoji: "🎵",
        warning: Some("Close Spotify before cleaning for best results"),
    },
];

pub fn category_skips_locking_paths(category_id: &str) -> bool {
    category_id == "thumbnail_cache"
}

pub fn is_action_category(category_id: &str) -> bool {
    category_id == "dns_cache"
}

pub fn is_browser_privacy_category(category_id: &str) -> bool {
    matches!(
        category_id,
        "chrome_cookies"
            | "chrome_history"
            | "chrome_site_storage"
            | "edge_cookies"
            | "edge_history"
            | "edge_site_storage"
            | "brave_cookies"
            | "brave_history"
            | "brave_site_storage"
            | "firefox_cookies"
            | "firefox_history"
            | "firefox_site_storage"
    )
}

pub fn category_needs_browser_check(category_id: &str) -> bool {
    matches!(
        category_id,
        "chrome_cache"
            | "edge_cache"
            | "firefox_cache"
            | "brave_cache"
            | "chrome_cookies"
            | "chrome_history"
            | "chrome_site_storage"
            | "edge_cookies"
            | "edge_history"
            | "edge_site_storage"
            | "brave_cookies"
            | "brave_history"
            | "brave_site_storage"
            | "firefox_cookies"
            | "firefox_history"
            | "firefox_site_storage"
    )
}

pub fn browser_privacy_installed(category_id: &str) -> bool {
    match category_id {
        "chrome_cookies" | "chrome_history" | "chrome_site_storage" => {
            chromium_user_data("Google", "Chrome").is_some()
        }
        "edge_cookies" | "edge_history" | "edge_site_storage" => {
            chromium_user_data("Microsoft", "Edge").is_some()
        }
        "brave_cookies" | "brave_history" | "brave_site_storage" => {
            chromium_user_data("BraveSoftware", "Brave-Browser").is_some()
        }
        "firefox_cookies" | "firefox_history" | "firefox_site_storage" => {
            !firefox_profiles().is_empty()
        }
        _ => false,
    }
}

pub fn resolve_category_paths(id: &str) -> Vec<PathBuf> {
    match id {
        "user_temp" => user_temp_paths(),
        "recycle_bin" => recycle_bin_paths(),
        "chrome_cache" => browser_cache_paths("Google", "Chrome"),
        "edge_cache" => browser_cache_paths("Microsoft", "Edge"),
        "firefox_cache" => firefox_cache_paths(),
        "brave_cache" => browser_cache_paths("BraveSoftware", "Brave-Browser"),
        "chrome_cookies" => browser_cookie_paths("Google", "Chrome"),
        "chrome_history" => browser_history_paths("Google", "Chrome"),
        "chrome_site_storage" => browser_site_storage_paths("Google", "Chrome"),
        "edge_cookies" => browser_cookie_paths("Microsoft", "Edge"),
        "edge_history" => browser_history_paths("Microsoft", "Edge"),
        "edge_site_storage" => browser_site_storage_paths("Microsoft", "Edge"),
        "brave_cookies" => browser_cookie_paths("BraveSoftware", "Brave-Browser"),
        "brave_history" => browser_history_paths("BraveSoftware", "Brave-Browser"),
        "brave_site_storage" => browser_site_storage_paths("BraveSoftware", "Brave-Browser"),
        "firefox_cookies" => firefox_cookie_paths(),
        "firefox_history" => firefox_history_paths(),
        "firefox_site_storage" => firefox_site_storage_paths(),
        "downloads_folder" => downloads_folder_paths(),
        "dns_cache" => vec![],
        "thumbnail_cache" => thumbnail_cache_paths(),
        "teams_cache" => teams_cache_paths(),
        "discord_cache" => discord_cache_paths(),
        "spotify_cache" => spotify_cache_paths(),
        _ => vec![],
    }
}

fn user_temp_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Ok(temp) = std::env::var("TEMP") {
        paths.push(PathBuf::from(temp));
    }
    if let Ok(tmp) = std::env::var("TMP") {
        paths.push(PathBuf::from(tmp));
    }
    if let Some(local) = dirs::data_local_dir() {
        paths.push(local.join("Temp"));
    }
    dedupe_paths(paths)
}

fn dedupe_paths(paths: Vec<PathBuf>) -> Vec<PathBuf> {
    let mut unique = Vec::new();
    for path in paths {
        let normalized = path
            .canonicalize()
            .unwrap_or_else(|_| path.clone())
            .to_string_lossy()
            .to_lowercase();
        if unique.iter().any(|p: &PathBuf| {
            p.canonicalize()
                .unwrap_or_else(|_| p.clone())
                .to_string_lossy()
                .to_lowercase()
                == normalized
        }) {
            continue;
        }
        unique.push(path);
    }
    unique
}

fn recycle_bin_paths() -> Vec<PathBuf> {
    std::env::var("SystemDrive")
        .map(|drive| vec![PathBuf::from(format!("{drive}\\$Recycle.Bin"))])
        .unwrap_or_default()
}

fn chromium_user_data(vendor: &str, browser: &str) -> Option<PathBuf> {
    let local = dirs::data_local_dir()?;
    let user_data = local.join(vendor).join(browser).join("User Data");
    if user_data.is_dir() {
        Some(user_data)
    } else {
        None
    }
}

fn chromium_profiles(user_data: &Path) -> Vec<PathBuf> {
    let mut profiles = Vec::new();

    if let Ok(entries) = std::fs::read_dir(user_data) {
        for entry in entries.flatten() {
            let profile = entry.path();
            if !profile.is_dir() {
                continue;
            }

            let name = profile
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default()
                .to_lowercase();

            if name == "default"
                || name == "guest profile"
                || name.starts_with("profile ")
                || name == "system profile"
            {
                profiles.push(profile);
            }
        }
    }

    profiles
}

fn firefox_profiles() -> Vec<PathBuf> {
    let Some(roaming) = dirs::data_dir() else {
        return vec![];
    };

    let firefox_root = roaming.join("Mozilla").join("Firefox");
    if !firefox_root.is_dir() {
        return vec![];
    }

    let mut profiles = Vec::new();
    let ini_path = firefox_root.join("profiles.ini");

    if let Ok(contents) = std::fs::read_to_string(&ini_path) {
        let mut current_path: Option<String> = None;
        let mut current_is_relative = true;

        let mut flush_profile = |path_opt: &mut Option<String>, is_relative: bool| {
            if let Some(profile_path) = path_opt.take() {
                let resolved = if is_relative {
                    firefox_root.join(profile_path)
                } else {
                    PathBuf::from(profile_path)
                };
                if resolved.is_dir() {
                    profiles.push(resolved);
                }
            }
        };

        for line in contents.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('[') && trimmed.ends_with(']') {
                flush_profile(&mut current_path, current_is_relative);
                current_is_relative = true;
                continue;
            }

            if let Some(value) = trimmed.strip_prefix("IsRelative=") {
                current_is_relative = value.trim() != "0";
                continue;
            }

            if let Some(value) = trimmed.strip_prefix("Path=") {
                current_path = Some(value.trim().to_string());
            }
        }

        flush_profile(&mut current_path, current_is_relative);
    }

    if profiles.is_empty() {
        let fallback = firefox_root.join("Profiles");
        if let Ok(entries) = std::fs::read_dir(fallback) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    profiles.push(path);
                }
            }
        }
    }

    dedupe_paths(profiles)
}

fn push_file(paths: &mut Vec<PathBuf>, path: PathBuf) {
    if path.is_file() {
        paths.push(path);
    }
}

fn push_dir(paths: &mut Vec<PathBuf>, path: PathBuf) {
    if path.is_dir() {
        paths.push(path);
    }
}

fn browser_cache_paths(vendor: &str, browser: &str) -> Vec<PathBuf> {
    let Some(user_data) = chromium_user_data(vendor, browser) else {
        return vec![];
    };

    let mut paths = Vec::new();
    let cache_names = ["Cache", "Code Cache", "GPUCache", "GrShaderCache"];

    for profile in chromium_profiles(&user_data) {
        for cache_name in &cache_names {
            let cache_path = profile.join(cache_name);
            if cache_path.exists() {
                paths.push(cache_path);
            }
        }
        let sw_cache = profile.join("Service Worker").join("CacheStorage");
        if sw_cache.exists() {
            paths.push(sw_cache);
        }
    }

    paths
}

fn browser_cookie_paths(vendor: &str, browser: &str) -> Vec<PathBuf> {
    let Some(user_data) = chromium_user_data(vendor, browser) else {
        return vec![];
    };

    let mut paths = Vec::new();
    let session_files = [
        "Last Session",
        "Last Tabs",
        "Current Session",
        "Current Tabs",
    ];

    for profile in chromium_profiles(&user_data) {
        push_file(&mut paths, profile.join("Cookies"));
        push_file(&mut paths, profile.join("Cookies-journal"));
        push_file(&mut paths, profile.join("Network").join("Cookies"));
        push_file(
            &mut paths,
            profile.join("Network").join("Cookies-journal"),
        );
        push_dir(&mut paths, profile.join("Sessions"));
        for name in session_files {
            push_file(&mut paths, profile.join(name));
        }
    }

    dedupe_paths(paths)
}

fn browser_history_paths(vendor: &str, browser: &str) -> Vec<PathBuf> {
    let Some(user_data) = chromium_user_data(vendor, browser) else {
        return vec![];
    };

    let mut paths = Vec::new();
    let history_files = [
        "History",
        "History-journal",
        "Top Sites",
        "Top Sites-journal",
        "Visited Links",
        "Favicons",
        "Favicons-journal",
    ];

    for profile in chromium_profiles(&user_data) {
        for name in history_files {
            push_file(&mut paths, profile.join(name));
        }
    }

    dedupe_paths(paths)
}

fn browser_site_storage_paths(vendor: &str, browser: &str) -> Vec<PathBuf> {
    let Some(user_data) = chromium_user_data(vendor, browser) else {
        return vec![];
    };

    let mut paths = Vec::new();

    for profile in chromium_profiles(&user_data) {
        push_dir(&mut paths, profile.join("Local Storage"));
        push_dir(&mut paths, profile.join("IndexedDB"));
        push_dir(&mut paths, profile.join("Session Storage"));
    }

    dedupe_paths(paths)
}

fn thumbnail_cache_paths() -> Vec<PathBuf> {
    let Some(explorer_dir) = dirs::data_local_dir().map(|local| {
        local
            .join("Microsoft")
            .join("Windows")
            .join("Explorer")
    }) else {
        return vec![];
    };

    if !explorer_dir.is_dir() {
        return vec![];
    }

    let mut paths = Vec::new();

    let Ok(entries) = std::fs::read_dir(&explorer_dir) else {
        return paths;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default()
            .to_lowercase();

        let is_thumbcache = name.starts_with("thumbcache_") && name.ends_with(".db");
        let is_iconcache = name.starts_with("iconcache_") && name.ends_with(".db");

        if is_thumbcache || is_iconcache {
            paths.push(path);
        }
    }

    paths
}

fn firefox_cache_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for profile in firefox_profiles() {
        push_dir(&mut paths, profile.join("cache2"));
        push_dir(&mut paths, profile.join("startupCache"));
        push_dir(&mut paths, profile.join("jumpListCache"));
    }

    dedupe_paths(paths)
}

fn firefox_cookie_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for profile in firefox_profiles() {
        push_file(&mut paths, profile.join("cookies.sqlite"));
        push_file(&mut paths, profile.join("cookies.sqlite-wal"));
        push_file(&mut paths, profile.join("cookies.sqlite-shm"));
        push_file(&mut paths, profile.join("sessionstore.jsonlz4"));
        push_file(&mut paths, profile.join("sessionstore-backups").join("recovery.jsonlz4"));
    }
    dedupe_paths(paths)
}

fn firefox_history_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for profile in firefox_profiles() {
        push_file(&mut paths, profile.join("places.sqlite"));
        push_file(&mut paths, profile.join("places.sqlite-wal"));
        push_file(&mut paths, profile.join("places.sqlite-shm"));
    }
    dedupe_paths(paths)
}

fn firefox_site_storage_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for profile in firefox_profiles() {
        let storage_root = profile.join("storage");
        push_dir(&mut paths, storage_root.join("default"));
        push_dir(&mut paths, storage_root.join("temporary"));
        push_dir(&mut paths, storage_root.join("permanent"));
    }
    dedupe_paths(paths)
}

fn downloads_folder_paths() -> Vec<PathBuf> {
    let Some(downloads) = dirs::download_dir() else {
        return vec![];
    };
    if downloads.is_dir() {
        vec![downloads]
    } else {
        vec![]
    }
}

pub fn open_downloads_in_explorer() -> Result<(), String> {
    let Some(downloads) = dirs::download_dir() else {
        return Err("Downloads folder not found".to_string());
    };
    if !downloads.is_dir() {
        return Err("Downloads folder not found".to_string());
    }

    #[cfg(windows)]
    {
        std::process::Command::new("explorer")
            .arg(&downloads)
            .spawn()
            .map_err(|error| format!("Failed to open Downloads folder: {error}"))?;
        return Ok(());
    }

    #[cfg(not(windows))]
    {
        let _ = downloads;
        Err("Opening Downloads in Explorer is only supported on Windows".to_string())
    }
}

fn teams_cache_paths() -> Vec<PathBuf> {
    let Some(local) = dirs::data_local_dir() else {
        return vec![];
    };

    let candidates = vec![
        local.join("Microsoft").join("Teams").join("Cache"),
        local.join("Microsoft").join("Teams").join("Code Cache"),
        local.join("Microsoft").join("Teams").join("GPUCache"),
        local
            .join("Packages")
            .join("MSTeams_8wekyb3d8bbwe")
            .join("LocalCache")
            .join("Microsoft")
            .join("MSTeams"),
    ];

    let mut paths = Vec::new();
    for candidate in candidates {
        push_dir(&mut paths, candidate);
    }

    dedupe_paths(paths)
}

fn discord_cache_paths() -> Vec<PathBuf> {
    let Some(local) = dirs::data_local_dir() else {
        return vec![];
    };

    let base = local.join("Discord");
    let mut paths = Vec::new();
    for name in ["Cache", "Code Cache", "GPUCache"] {
        push_dir(&mut paths, base.join(name));
    }

    dedupe_paths(paths)
}

fn spotify_cache_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Some(local) = dirs::data_local_dir() {
        let base = local.join("Spotify");
        push_dir(&mut paths, base.join("Storage"));
        push_dir(&mut paths, base.join("Browser").join("Cache"));
        push_dir(&mut paths, base.join("Browser").join("Code Cache"));
        push_dir(&mut paths, base.join("Browser").join("GPUCache"));
    }

    dedupe_paths(paths)
}
