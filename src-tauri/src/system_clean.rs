#[cfg(windows)]
pub fn flush_dns_cache() -> Result<(), String> {
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let output = Command::new("ipconfig")
        .args(["/flushdns"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|err| err.to_string())?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let detail = if stderr.is_empty() { stdout } else { stderr };

    Err(if detail.is_empty() {
        "ipconfig /flushdns failed".into()
    } else {
        detail
    })
}

#[cfg(not(windows))]
pub fn flush_dns_cache() -> Result<(), String> {
    Err("DNS cache flush is only supported on Windows".into())
}
