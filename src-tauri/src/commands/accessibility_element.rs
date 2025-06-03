use std::{thread, time::Duration};

use accessibility_sys::{
    kAXTrustedCheckOptionPrompt, AXIsProcessTrusted, AXIsProcessTrustedWithOptions,
};
use cocoa::{
    appkit::{CGPoint, NSRunningApplication},
    base::id,
};
use core_foundation::{
    base::TCFType, boolean::CFBoolean, dictionary::CFDictionary, string::CFString,
};

use core_graphics::geometry::CGSize;
use objc2::{msg_send, runtime::AnyClass};
use objc2_foundation::NSProcessInfo;
use tauri::command;

use crate::{
    data::window_info::WindowInfo,
    extensions::accessibility_elements::{
        get_active_window, get_window_from_id, set_position, set_size,
    },
};

#[command]
pub fn accessibility_element_under_cursor() -> Result<WindowInfo, ()> {
    let win = get_active_window();
    let result = match win {
        Ok(win) => Ok(WindowInfo {
            pid: win.process_id,
            window_id: win.window_id as u32,
            frame: win.frame,
        }),
        Err(_) => Err(()),
    };

    return result;
}

#[command]
pub fn accessibility_element_set_frame(window_info: WindowInfo) {
    let process_info = NSProcessInfo::processInfo();
    let pid: i64 = unsafe { process_info.processIdentifier() as i64 };

    if window_info.pid == pid {
        return;
    }

    let window = get_window_from_id(window_info.pid, window_info.window_id);

    match window {
        Ok(window) => {
            set_position(
                window,
                CGPoint {
                    x: window_info.frame.position.x,
                    y: window_info.frame.position.y,
                },
            );
            thread::sleep(Duration::from_millis(10));
            set_size(
                window,
                CGSize {
                    width: window_info.frame.size.width,
                    height: window_info.frame.size.height,
                },
            );
        }
        Err(_) => {}
    }
}

#[command]
pub fn accessibility_element_check_permission() -> bool {
    unsafe {
        let is_trusted = AXIsProcessTrusted();
        if !is_trusted {
            let option_prompt = CFString::wrap_under_get_rule(kAXTrustedCheckOptionPrompt);
            let dict: CFDictionary<CFString, CFBoolean> =
                CFDictionary::from_CFType_pairs(&[(option_prompt, CFBoolean::true_value())]);
            AXIsProcessTrustedWithOptions(dict.as_concrete_TypeRef());
        }

        return is_trusted;
    }
}
