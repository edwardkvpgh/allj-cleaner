use crate::scanner::ScanStats;

#[cfg(target_os = "windows")]
mod windows_impl {
    use super::ScanStats;
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    fn run_powershell(script: &str) -> Result<String, String> {
        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(if stderr.is_empty() {
                "PowerShell command failed".into()
            } else {
                stderr.to_string()
            });
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    pub fn scan() -> ScanStats {
        let script = r#"
$items = @((New-Object -ComObject Shell.Application).Namespace(10).Items())
$size = [int64]0
foreach ($item in $items) {
    $itemSize = [int64]0
    try {
        $ext = $item.ExtendedProperty('System.Size')
        if ($null -ne $ext -and "$ext" -ne '') {
            $itemSize = [int64]$ext
        }
    } catch {}
    if ($itemSize -le 0) {
        $itemSize = [int64]$item.Size
    }
    $size += $itemSize
}
[PSCustomObject]@{ count = $items.Count; size = $size } | ConvertTo-Json -Compress
"#;

        match run_powershell(script) {
            Ok(json) => parse_stats(&json),
            Err(_) => ScanStats::default(),
        }
    }

    pub fn empty() -> Result<ScanStats, String> {
        let before = scan();

        if before.file_count == 0 && before.size_bytes == 0 {
            return Ok(before);
        }

        run_powershell("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")?;

        let after = scan();
        if after.file_count > 0 {
            return Err(format!(
                "Recycle Bin may not have emptied fully ({} items remain)",
                after.file_count
            ));
        }

        Ok(before)
    }

    fn parse_stats(json: &str) -> ScanStats {
        let Ok(value) = serde_json::from_str::<serde_json::Value>(json) else {
            return ScanStats::default();
        };

        ScanStats {
            file_count: value["count"].as_u64().unwrap_or(0),
            size_bytes: value["size"].as_u64().unwrap_or(0),
        }
    }
}

#[cfg(target_os = "windows")]
pub use windows_impl::{empty, scan};

#[cfg(not(target_os = "windows"))]
pub fn scan() -> ScanStats {
    use crate::paths::resolve_category_paths;
    crate::scanner::scan_paths(&resolve_category_paths("recycle_bin"))
}

#[cfg(not(target_os = "windows"))]
pub fn empty() -> Result<ScanStats, String> {
    use crate::paths::resolve_category_paths;
    use std::fs;
    use walkdir::WalkDir;

    let paths = resolve_category_paths("recycle_bin");
    let before = crate::scanner::scan_paths(&paths);

    for path in &paths {
        if path.exists() {
            for entry in WalkDir::new(path).min_depth(1).into_iter().filter_map(|e| e.ok()) {
                let _ = if entry.file_type().is_dir() {
                    fs::remove_dir_all(entry.path())
                } else {
                    fs::remove_file(entry.path())
                };
            }
        }
    }

    Ok(before)
}
