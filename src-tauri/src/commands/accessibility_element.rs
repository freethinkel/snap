use accessibility_sys::{
    kAXTrustedCheckOptionPrompt, AXIsProcessTrusted, AXIsProcessTrustedWithOptions,
};
use active_win_pos_rs::get_active_window;
use cocoa::{
    appkit::{CGPoint, NSApp, NSRunningApplication},
    base::{id, nil},
    foundation::{NSBundle, NSString},
};
use core_foundation::{
    base::TCFType, boolean::CFBoolean, dictionary::CFDictionary, string::CFString,
};
use core_graphics::geometry::CGSize;
use objc_id::Id;
use tauri::{command, AppHandle};

use crate::{
    data::{
        frame::{Frame, Point, Size},
        window_info::WindowInfo,
    },
    extensions::accessibility_elements::{get_window_from_id, set_position, set_size},
};

#[command]
pub fn accessibility_element_under_cursor() -> Result<WindowInfo, ()> {
    let win = get_active_window();
    let result = match win {
        Ok(win) => Ok(WindowInfo {
            pid: win.process_id as i32,
            window_id: win.window_id.parse().unwrap_or(0),
            frame: Frame {
                size: Size {
                    width: win.position.width,
                    height: win.position.height,
                },
                position: Point {
                    x: win.position.x,
                    y: win.position.y,
                },
            },
        }),
        Err(_) => Err(()),
    };

    return result;
}

#[command]
pub fn accessibility_element_set_frame(window_info: WindowInfo) {
    let selected_app_bundle_id = unsafe {
        NSRunningApplication::runningApplicationWithProcessIdentifier(nil, window_info.pid)
            .bundleIdentifier()
    };
    let current_app_bundle_id =
        unsafe { NSRunningApplication::currentApplication(nil).bundleIdentifier() };

    if selected_app_bundle_id == current_app_bundle_id {
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
