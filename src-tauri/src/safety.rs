use std::path::{Path, PathBuf};

const BLOCKED_SEGMENTS: &[&str] = &[
    "system32",
    "syswow64",
    "windows\\winsxs",
    "program files",
    "program files (x86)",
    "users\\public",
];

pub fn resolved_roots(paths: &[PathBuf]) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    for path in paths {
        let resolved = normalize(path);
        if roots.iter().any(|existing| paths_equal(existing, &resolved)) {
            continue;
        }
        roots.push(resolved);
    }
    roots
}

pub fn is_safe_target(path: &Path, allowed_roots: &[PathBuf]) -> bool {
    let normalized = normalize(path);
    let normalized_str = normalized.to_string_lossy().to_lowercase();

    for blocked in BLOCKED_SEGMENTS {
        if normalized_str.contains(blocked) {
            return false;
        }
    }

    allowed_roots
        .iter()
        .any(|root| is_within_root(&normalized, root))
}

fn is_within_root(path: &Path, root: &Path) -> bool {
    let path_str = normalize(path).to_string_lossy().to_lowercase();
    let root_str = normalize(root).to_string_lossy().to_lowercase();

    if path_str == root_str {
        return true;
    }

    let prefix = if root_str.ends_with('\\') {
        root_str.clone()
    } else {
        format!("{root_str}\\")
    };

    path_str.starts_with(&prefix)
}

fn normalize(path: &Path) -> PathBuf {
    path.canonicalize().unwrap_or_else(|_| path.to_path_buf())
}

fn paths_equal(a: &Path, b: &Path) -> bool {
    normalize(a).to_string_lossy().to_lowercase() == normalize(b).to_string_lossy().to_lowercase()
}
