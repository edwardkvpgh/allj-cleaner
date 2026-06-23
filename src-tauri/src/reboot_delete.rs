#[cfg(windows)]
pub fn schedule_delete_on_reboot(path: &std::path::Path) -> bool {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::MoveFileExW;

    const MOVEFILE_DELAY_UNTIL_REBOOT: u32 = 0x4;

    let wide: Vec<u16> = path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe { MoveFileExW(wide.as_ptr(), std::ptr::null(), MOVEFILE_DELAY_UNTIL_REBOOT) != 0 }
}

#[cfg(not(windows))]
pub fn schedule_delete_on_reboot(_path: &std::path::Path) -> bool {
    false
}
