#[cfg(windows)]
mod windows_impl {
    use crate::scanner::ScanStats;
    use std::ffi::c_void;
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    use std::thread;
    use std::time::Duration;
    use windows_sys::Win32::Globalization::lstrlenW;
    use windows_sys::Win32::System::DataExchange::{
        CloseClipboard, CountClipboardFormats, EmptyClipboard, GetClipboardData,
        IsClipboardFormatAvailable, OpenClipboard, RegisterClipboardFormatW,
    };
    use windows_sys::Win32::System::Memory::{GlobalLock, GlobalSize, GlobalUnlock};
    use windows_sys::Win32::System::Ole::{
        CF_BITMAP, CF_DIB, CF_DIBV5, CF_HDROP, CF_TEXT, CF_UNICODETEXT,
    };

    const CLIPBOARD_RETRIES: u32 = 6;
    const CLIPBOARD_RETRY_MS: u64 = 60;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    const MIN_IMAGE_BYTES: usize = 48;

    fn with_clipboard<T>(mut action: impl FnMut() -> T) -> Option<T> {
        for attempt in 0..CLIPBOARD_RETRIES {
            unsafe {
                if OpenClipboard(std::ptr::null_mut()) != 0 {
                    let result = action();
                    CloseClipboard();
                    return Some(result);
                }
            }

            if attempt + 1 < CLIPBOARD_RETRIES {
                thread::sleep(Duration::from_millis(CLIPBOARD_RETRY_MS));
            }
        }

        None
    }

    fn wide_string(value: &str) -> Vec<u16> {
        OsStr::new(value)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }

    fn register_format(name: &str) -> u32 {
        let wide = wide_string(name);
        unsafe { RegisterClipboardFormatW(wide.as_ptr()) }
    }

    fn handle_size(handle: *mut c_void) -> usize {
        if handle.is_null() {
            return 0;
        }
        unsafe { GlobalSize(handle) }
    }

    fn unicode_text_size() -> usize {
        let handle = unsafe { GetClipboardData(CF_UNICODETEXT as u32) } as *mut c_void;
        if handle.is_null() {
            return 0;
        }

        unsafe {
            let ptr = GlobalLock(handle) as *const u16;
            if ptr.is_null() {
                return 0;
            }

            let chars = lstrlenW(ptr);
            GlobalUnlock(handle);

            if chars <= 0 {
                return 0;
            }

            (chars as usize + 1) * 2
        }
    }

    fn ansi_text_size() -> usize {
        let handle = unsafe { GetClipboardData(CF_TEXT as u32) } as *mut c_void;
        if handle.is_null() {
            return 0;
        }

        unsafe {
            let size = GlobalSize(handle);
            if size == 0 {
                return 0;
            }

            let ptr = GlobalLock(handle) as *const u8;
            if ptr.is_null() {
                return 0;
            }

            let mut len = 0usize;
            while len < size {
                if *ptr.add(len) == 0 {
                    break;
                }
                len += 1;
            }
            GlobalUnlock(handle);

            if len == 0 {
                return 0;
            }

            len + 1
        }
    }

    fn image_size(format: u16) -> usize {
        if unsafe { IsClipboardFormatAvailable(format as u32) } == 0 {
            return 0;
        }

        let handle = unsafe { GetClipboardData(format as u32) } as *mut c_void;
        let size = handle_size(handle);
        if size >= MIN_IMAGE_BYTES {
            size
        } else {
            0
        }
    }

    fn registered_image_size(name: &str) -> usize {
        let format = register_format(name);
        if format == 0 {
            return 0;
        }

        if unsafe { IsClipboardFormatAvailable(format) } == 0 {
            return 0;
        }

        let handle = unsafe { GetClipboardData(format) } as *mut c_void;
        let size = handle_size(handle);
        if size >= MIN_IMAGE_BYTES {
            size
        } else {
            0
        }
    }

    fn file_drop_size() -> usize {
        if unsafe { IsClipboardFormatAvailable(CF_HDROP as u32) } == 0 {
            return 0;
        }

        let handle = unsafe { GetClipboardData(CF_HDROP as u32) } as *mut c_void;
        let size = handle_size(handle);
        if size > 20 { size } else { 0 }
    }

    fn clipboard_payload() -> ScanStats {
        let format_count = unsafe { CountClipboardFormats() };
        if format_count <= 0 {
            return ScanStats::default();
        }

        let mut sizes = Vec::new();

        if let Some(size) = [unicode_text_size(), ansi_text_size()]
            .into_iter()
            .max()
            .filter(|size| *size > 0)
        {
            sizes.push(size);
        }

        for format in [CF_BITMAP, CF_DIB, CF_DIBV5] {
            let size = image_size(format);
            if size > 0 {
                sizes.push(size);
            }
        }

        for name in ["PNG", "JFIF", "GIF", "WebP", "image/png"] {
            let size = registered_image_size(name);
            if size > 0 {
                sizes.push(size);
            }
        }

        let file_size = file_drop_size();
        if file_size > 0 {
            sizes.push(file_size);
        }

        if sizes.is_empty() {
            return ScanStats::default();
        }

        ScanStats {
            size_bytes: sizes.iter().copied().max().unwrap_or(0) as u64,
            file_count: sizes.len() as u64,
        }
    }

    fn clear_clipboard_history() {
        let _ = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Sta",
                "-Command",
                r#"try { Set-Clipboard -Value $null } catch {}
try {
  [Windows.ApplicationModel.DataTransfer.Clipboard,Windows.ApplicationModel.DataTransfer,ContentType=WindowsRuntime] | Out-Null
  [Windows.ApplicationModel.DataTransfer.Clipboard]::ClearHistory()
} catch {}"#,
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
    }

    pub fn scan() -> ScanStats {
        with_clipboard(clipboard_payload).unwrap_or_default()
    }

    pub fn clear() -> Result<ScanStats, String> {
        let before = scan();
        if before.file_count == 0 {
            clear_clipboard_history();
            return Ok(before);
        }

        let snapshot = ScanStats {
            size_bytes: before.size_bytes,
            file_count: before.file_count,
        };

        let cleared = with_clipboard(|| unsafe { EmptyClipboard() }).ok_or_else(|| {
            String::from("clipboard is busy — close apps using it and try again")
        })?;

        if cleared == 0 {
            return Err("could not empty clipboard".into());
        }

        clear_clipboard_history();

        thread::sleep(Duration::from_millis(120));

        Ok(snapshot)
    }
}

#[cfg(windows)]
pub use windows_impl::{clear, scan};

#[cfg(not(windows))]
use crate::scanner::ScanStats;

#[cfg(not(windows))]
pub fn scan() -> ScanStats {
    ScanStats::default()
}

#[cfg(not(windows))]
pub fn clear() -> Result<ScanStats, String> {
    Err("Clipboard cleaning is only supported on Windows".into())
}
