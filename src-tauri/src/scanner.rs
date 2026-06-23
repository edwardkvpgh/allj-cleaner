use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Default, Clone)]
pub struct ScanStats {
    pub size_bytes: u64,
    pub file_count: u64,
}

pub fn scan_paths(paths: &[PathBuf]) -> ScanStats {
    let mut total = ScanStats::default();

    for path in paths {
        if !path.exists() {
            continue;
        }
        let stats = scan_single(path);
        total.size_bytes += stats.size_bytes;
        total.file_count += stats.file_count;
    }

    total
}

fn scan_single(path: &Path) -> ScanStats {
    let mut stats = ScanStats::default();

    if path.is_file() {
        if let Ok(meta) = path.metadata() {
            stats.size_bytes = meta.len();
            stats.file_count = 1;
        }
        return stats;
    }

    for entry in WalkDir::new(path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            stats.file_count += 1;
            stats.size_bytes += entry.metadata().map(|m| m.len()).unwrap_or(0);
        }
    }

    stats
}
