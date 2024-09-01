use cocoa::base::id;
use core_foundation::{
    array::{CFArray, CFArrayRef},
    base::{CFType, FromVoid, TCFType, ToVoid},
    boolean::CFBoolean,
    number::CFNumber,
    string::CFString,
};
use core_graphics::display::{
    kCGNullWindowID, kCGWindowListExcludeDesktopElements, CFDictionary, CGWindowListCopyWindowInfo,
};
use objc::{msg_send, runtime::Class, sel, sel_impl};
use serde::{Deserialize, Serialize};

use crate::data::frame::{Frame, Point, Size};

#[derive(Serialize, Deserialize, Clone)]
pub struct WindowInfo {
    id: Option<i32>,
    pid: Option<i32>,
    name: Option<String>,
    frame: Option<Frame>,
    is_on_screen: bool,
}

pub fn get_windows_on_screen() -> Vec<WindowInfo> {
    let window_list_info =
        unsafe { CGWindowListCopyWindowInfo(kCGWindowListExcludeDesktopElements, kCGNullWindowID) };

    let window_list: CFArray<CFDictionary<CFString, CFType>> =
        unsafe { TCFType::wrap_under_create_rule(window_list_info as CFArrayRef) };
    let mut windows: Vec<WindowInfo> = vec![];

    let process_info_class = Class::get("NSProcessInfo").unwrap();
    let process_info: id = unsafe { msg_send![process_info_class, processInfo] };
    let pid: i32 = unsafe { msg_send![process_info, processIdentifier] };

    for i in 0..CFArray::len(&window_list) {
        let window = window_list.get(i).unwrap();

        let window_name = window
            .find(CFString::new("kCGWindowOwnerName"))
            .and_then(|value| value.downcast::<CFString>().map(|value| value.to_string()));
        let window_id = window
            .find(CFString::new("kCGWindowNumber"))
            .and_then(|value| {
                value
                    .downcast::<CFNumber>()
                    .map(|value| value.to_i32().unwrap())
            });
        let window_pid = window
            .find(CFString::new("kCGWindowOwnerPID"))
            .and_then(|value| {
                value
                    .downcast::<CFNumber>()
                    .map(|value| value.to_i32().unwrap())
            });
        let window_level = window
            .find(CFString::new("kCGWindowLayer"))
            .and_then(|value| {
                value
                    .downcast::<CFNumber>()
                    .map(|value| value.to_i32().unwrap())
            });
        let window_is_on_screen =
            window
                .find(CFString::new("kCGWindowIsOnscreen"))
                .and_then(|value| {
                    value
                        .downcast::<CFBoolean>()
                        .map(|value| value == true.into())
                });
        let window_bounds = window
            .find(CFString::new("kCGWindowBounds"))
            .and_then(|value| {
                value.downcast::<CFDictionary>().map(|value| Frame {
                    size: Size {
                        width: value
                            .find(CFString::new("Width").to_void())
                            .and_then(|value| unsafe { CFNumber::from_void(*value).to_f64() })
                            .unwrap(),
                        height: value
                            .find(CFString::new("Height").to_void())
                            .and_then(|value| unsafe { CFNumber::from_void(*value).to_f64() })
                            .unwrap(),
                    },
                    position: Point {
                        x: value
                            .find(CFString::new("X").to_void())
                            .and_then(|value| unsafe { CFNumber::from_void(*value).to_f64() })
                            .unwrap(),
                        y: value
                            .find(CFString::new("Y").to_void())
                            .and_then(|value| unsafe { CFNumber::from_void(*value).to_f64() })
                            .unwrap(),
                    },
                })
            });

        let window_info = WindowInfo {
            pid: window_pid,
            id: window_id,
            name: window_name,
            frame: window_bounds,
            is_on_screen: window_is_on_screen.unwrap_or(false),
        };

        if let Some(window_pid) = window_info.pid {
            if let Some(level) = window_level {
                if window_pid != pid && level == 0 {
                    windows.push(window_info);
                }
            }
        }
    }

    windows
}
