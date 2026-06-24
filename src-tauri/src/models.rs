use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanCategory {
    pub id: String,
    pub name: String,
    pub description: String,
    pub emoji: String,
    pub size_bytes: u64,
    pub file_count: u64,
    pub paths: Vec<String>,
    pub available: bool,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadEntry {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub size_bytes: u64,
    pub file_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanResult {
    pub freed_bytes: u64,
    pub files_removed: u64,
    pub files_skipped_locked: u64,
    pub files_scheduled_reboot: u64,
    pub errors: Vec<String>,
    pub categories_cleaned: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockingApp {
    pub pid: u32,
    pub name: String,
    #[serde(default = "default_process_count")]
    pub process_count: u32,
    #[serde(default)]
    pub pids: Vec<u32>,
}

fn default_process_count() -> u32 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterferenceApp {
    pub pid: u32,
    pub name: String,
    #[serde(default = "default_process_count")]
    pub process_count: u32,
    #[serde(default)]
    pub pids: Vec<u32>,
    pub closeable: bool,
    #[serde(default)]
    pub holding_lock: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloseAppsResult {
    pub closed: Vec<LockingApp>,
    pub failed: Vec<String>,
}
