use std::path::PathBuf;

pub struct CategoryDef {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub emoji: &'static str,
    pub warning: Option<&'static str>,
}

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
        id: "clipboard",
        name: "Clipboard",
        description: "Copied text and images sitting in your paste buffer",
        emoji: "📋",
        warning: Some(
            "Clears Ctrl+V paste buffer and Win+V history when possible — open Win+V and tap Clear all if images linger",
        ),
    },
];

pub fn resolve_category_paths(id: &str) -> Vec<PathBuf> {
    match id {
        "user_temp" => user_temp_paths(),
        "recycle_bin" => recycle_bin_paths(),
        "chrome_cache" => browser_cache_paths("Google", "Chrome"),
        "edge_cache" => browser_cache_paths("Microsoft", "Edge"),
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

fn browser_cache_paths(vendor: &str, browser: &str) -> Vec<PathBuf> {
    let Some(local) = dirs::data_local_dir() else {
        return vec![];
    };

    let user_data = local.join(vendor).join(browser).join("User Data");
    if !user_data.exists() {
        return vec![];
    }

    let mut paths = Vec::new();
    let cache_names = ["Cache", "Code Cache", "GPUCache", "GrShaderCache"];

    if let Ok(entries) = std::fs::read_dir(&user_data) {
        for entry in entries.flatten() {
            let profile = entry.path();
            if !profile.is_dir() {
                continue;
            }
            for cache_name in &cache_names {
                let cache_path = profile.join(cache_name);
                if cache_path.exists() {
                    paths.push(cache_path);
                }
            }
            let sw_cache = profile
                .join("Service Worker")
                .join("CacheStorage");
            if sw_cache.exists() {
                paths.push(sw_cache);
            }
        }
    }

    paths
}
