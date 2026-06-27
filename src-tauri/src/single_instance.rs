#[cfg(windows)]
mod windows_impl {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    use std::thread;
    use std::time::Duration;
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        MessageBoxW, MB_ICONWARNING, MB_YESNO, IDYES,
    };

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    fn wide_string(value: &str) -> Vec<u16> {
        OsStr::new(value)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }

    fn exe_name() -> Option<String> {
        std::env::current_exe()
            .ok()?
            .file_name()?
            .to_str()
            .map(str::to_string)
    }

    fn other_instances_exist() -> bool {
        let Some(name) = exe_name() else {
            return false;
        };
        let my_pid = std::process::id();

        let output = match Command::new("tasklist")
            .args(["/FI", &format!("IMAGENAME eq {name}"), "/FO", "CSV", "/NH"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            Ok(output) if output.status.success() => output.stdout,
            _ => return false,
        };

        let text = String::from_utf8_lossy(&output);
        text.lines().any(|line| {
            let line = line.trim();
            if line.is_empty() || line.starts_with("INFO:") {
                return false;
            }

            let pid = line
                .split(',')
                .nth(1)
                .and_then(|value| value.trim_matches('"').parse::<u32>().ok());

            pid.is_some_and(|pid| pid != my_pid)
        })
    }

    fn prompt_close_existing() -> bool {
        let message = wide_string(
            "Detox is already running.\n\nClose the other window and start a fresh one?",
        );
        let title = wide_string("Detox");

        unsafe {
            MessageBoxW(
                std::ptr::null_mut(),
                message.as_ptr(),
                title.as_ptr(),
                MB_YESNO | MB_ICONWARNING,
            ) == IDYES
        }
    }

    fn kill_other_instances() {
        let my_pid = std::process::id();
        let Some(name) = exe_name() else {
            return;
        };

        let filter = format!("PID ne {my_pid}");
        let _ = Command::new("taskkill")
            .args(["/F", "/IM", &name, "/FI", &filter])
            .creation_flags(CREATE_NO_WINDOW)
            .status();

        thread::sleep(Duration::from_millis(800));
    }

    fn show_manual_close_message() {
        let message = wide_string(
            "Could not close the other Detox window.\n\nClose it manually, then try again.",
        );
        let title = wide_string("Detox");
        unsafe {
            MessageBoxW(
                std::ptr::null_mut(),
                message.as_ptr(),
                title.as_ptr(),
                MB_ICONWARNING,
            );
        }
    }

    pub fn acquire_or_prompt() -> bool {
        if cfg!(debug_assertions) {
            return true;
        }

        if !other_instances_exist() {
            return true;
        }

        if !prompt_close_existing() {
            return false;
        }

        kill_other_instances();

        if other_instances_exist() {
            show_manual_close_message();
            return false;
        }

        true
    }
}

#[cfg(windows)]
pub use windows_impl::acquire_or_prompt;

#[cfg(not(windows))]
pub fn acquire_or_prompt() -> bool {
    true
}
