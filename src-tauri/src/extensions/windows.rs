use std::ptr;

use accessibility_sys::{kAXMainAttribute, AXUIElementCopyAttributeValue};
use core_foundation::{
    array::{CFArrayGetCount, CFArrayGetValueAtIndex},
    base::{CFRelease, CFTypeRef, TCFType},
    number::{CFBooleanGetValue, CFBooleanRef},
    string::CFString,
};
use core_graphics::display::{
    kCGNullWindowID, kCGWindowListExcludeDesktopElements, CFDictionaryRef,
    CGWindowListCopyWindowInfo,
};
use objc2_foundation::NSProcessInfo;
use serde::{Deserialize, Serialize};

use crate::{
    data::frame::Frame,
    extensions::accessibility_elements::{get_from_dict, DictEntryValue},
};

use super::accessibility_elements::get_window_from_id;

#[derive(Serialize, Deserialize, Clone)]
pub struct WindowInfo {
    id: Option<i64>,
    pid: Option<i64>,
    name: Option<String>,
    frame: Option<Frame>,
    is_main: bool,
}

pub fn get_windows_on_screen() -> Vec<WindowInfo> {
    let window_list_info =
        unsafe { CGWindowListCopyWindowInfo(kCGWindowListExcludeDesktopElements, kCGNullWindowID) };

    let windows_count: isize = unsafe { CFArrayGetCount(window_list_info) };

    let process_info = NSProcessInfo::processInfo();
    let pid: i64 = unsafe { process_info.processIdentifier() as i64 };

    let mut windows: Vec<WindowInfo> = vec![];

    for i in 0..windows_count {
        let mut win_pos = Frame::default();
        let mut win_title = String::from("");

        let dic_ref = unsafe { CFArrayGetValueAtIndex(window_list_info, i) as CFDictionaryRef };

        if dic_ref.is_null() {
            continue;
        }

        let window_pid = get_from_dict(dic_ref, "kCGWindowOwnerPID");
        let is_on_screen = get_from_dict(dic_ref, "kCGWindowIsOnscreen");
        let window_level = get_from_dict(dic_ref, "kCGWindowLayer");

        if let DictEntryValue::_Number(win_pid) = window_pid {
            if win_pid == pid {
                continue;
            }

            if let DictEntryValue::_Number(win_level) = window_level {
                if win_level != 0 {
                    continue;
                }
            } else {
                continue;
            }

            if let DictEntryValue::_Bool(is_on_screen) = is_on_screen {
                if !is_on_screen {
                    continue;
                }
            } else {
                continue;
            }

            if let DictEntryValue::_Rect(window_bounds) = get_from_dict(dic_ref, "kCGWindowBounds")
            {
                win_pos = window_bounds;
            }

            if let DictEntryValue::_String(window_title) =
                get_from_dict(dic_ref, "kCGWindowOwnerName")
            {
                win_title = window_title;
            }

            if let DictEntryValue::_Number(window_id) = get_from_dict(dic_ref, "kCGWindowNumber") {
                let is_main = is_main_window(win_pid, window_id as u32);

                let window_info = WindowInfo {
                    pid: Some(win_pid),
                    id: Some(window_id),
                    name: Some(win_title),
                    frame: Some(win_pos),
                    is_main,
                };

                windows.push(window_info);
            }
        }
    }

    unsafe { CFRelease(window_list_info as CFTypeRef) }

    windows
}

pub fn is_main_window(window_pid: i64, window_id: u32) -> bool {
    let mut is_main = false;
    let mut value: CFTypeRef = ptr::null();

    let win = get_window_from_id(window_pid, window_id);
    if let Ok(window) = win {
        unsafe {
            AXUIElementCopyAttributeValue(
                window,
                CFString::new(kAXMainAttribute).as_concrete_TypeRef(),
                &mut value as *mut CFTypeRef,
            )
        };
        is_main = unsafe {
            if !value.is_null() {
                CFBooleanGetValue(value as CFBooleanRef)
            } else {
                false
            }
        };
    }

    is_main
}
