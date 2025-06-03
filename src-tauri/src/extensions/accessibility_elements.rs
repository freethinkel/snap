use std::{ffi::c_void, path::PathBuf, ptr};

use super::helpers::FromCgRect;
use crate::{data::frame::Frame, extensions::windows::is_main_window};
use accessibility_sys::{
    kAXErrorSuccess, kAXPositionAttribute, kAXSizeAttribute, kAXValueTypeCGPoint,
    kAXValueTypeCGSize, kAXWindowsAttribute, AXError, AXUIElementCopyAttributeValue,
    AXUIElementCreateApplication, AXUIElementRef, AXUIElementSetAttributeValue, AXValueCreate,
};
use cocoa::{appkit::CGPoint, base::id, foundation::NSArray};
use core_foundation::{
    base::{CFGetTypeID, CFTypeID, CFTypeRef, TCFType, ToVoid},
    dictionary::CFDictionaryGetTypeID,
    number::{
        CFBooleanGetTypeID, CFBooleanGetValue, CFNumberGetType, CFNumberGetTypeID,
        CFNumberGetValue, CFNumberRef, CFNumberType,
    },
    string::{CFString, CFStringGetTypeID},
};
use core_graphics::base::boolean_t;
use core_graphics::{display::*, geometry::CGSize};
use objc2::{msg_send, runtime::AnyObject};
use objc2_app_kit::NSWorkspace;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    pub fn CGRectMakeWithDictionaryRepresentation(
        dict: CFDictionaryRef,
        rect: *mut CGRect,
    ) -> boolean_t;
}

#[derive(Debug)]
pub enum DictEntryValue {
    _Number(i64),
    _Bool(bool),
    _String(String),
    _Rect(Frame),
    _Unknown,
}

pub fn get_window_from_id(pid: i64, id: u32) -> Result<AXUIElementRef, ()> {
    let window_owner = unsafe { AXUIElementCreateApplication(pid as i32) };

    let mut windows_ref: CFTypeRef = ptr::null();

    unsafe {
        AXUIElementCopyAttributeValue(
            window_owner,
            CFString::new(kAXWindowsAttribute).as_concrete_TypeRef(),
            &mut windows_ref as *mut CFTypeRef,
        );
    }

    if windows_ref.is_null() {
        return Err(());
    }

    let applications_windows_nsarray = windows_ref as id;

    let target_window_ax = {
        let count = unsafe { NSArray::count(applications_windows_nsarray) };
        let mut window_ax_option: Option<id> = None;
        for i in 0..count {
            let window_ax = unsafe { NSArray::objectAtIndex(applications_windows_nsarray, i) };

            let window_id = {
                let mut window_id: CGWindowID = 0;
                if unsafe { _AXUIElementGetWindow(window_ax as AXUIElementRef, &mut window_id) }
                    != kAXErrorSuccess
                {
                    continue;
                }
                window_id
            };

            if window_id == id {
                window_ax_option = Some(window_ax);
                break;
            }
        }
        window_ax_option
    }
    .ok_or(())? as AXUIElementRef;

    return Ok(target_window_ax);
}

pub fn set_position(window: AXUIElementRef, mut point: CGPoint) {
    let ptr = &mut point as *mut _ as *mut c_void;
    unsafe {
        AXUIElementSetAttributeValue(
            window,
            CFString::new(kAXPositionAttribute).as_concrete_TypeRef(),
            AXValueCreate(kAXValueTypeCGPoint, ptr).cast(),
        );
    }
}
pub fn set_size(window: AXUIElementRef, mut size: CGSize) {
    let ptr = &mut size as *mut _ as *mut c_void;
    unsafe {
        AXUIElementSetAttributeValue(
            window,
            CFString::new(kAXSizeAttribute).as_concrete_TypeRef(),
            AXValueCreate(kAXValueTypeCGSize, ptr).cast(),
        );
    }
}

extern "C" {
    fn _AXUIElementGetWindow(element: AXUIElementRef, window_id: *mut CGWindowID) -> AXError;
}

#[allow(non_upper_case_globals)]
pub const kCFNumberSInt32Type: CFNumberType = 3;
#[allow(non_upper_case_globals)]
pub const kCFNumberSInt64Type: CFNumberType = 4;

// Taken from https://github.com/sassman/t-rec-rs/blob/v0.7.0/src/macos/window_id.rs#L73
// Modified to support dictionary type id for kCGWindowBounds
pub fn get_from_dict(dict: CFDictionaryRef, key: &str) -> DictEntryValue {
    let cf_key: CFString = key.into();
    let mut value: *const c_void = std::ptr::null();
    if unsafe { CFDictionaryGetValueIfPresent(dict, cf_key.to_void(), &mut value) } != 0 {
        let type_id: CFTypeID = unsafe { CFGetTypeID(value) };
        if type_id == unsafe { CFNumberGetTypeID() } {
            let value = value as CFNumberRef;

            #[allow(non_upper_case_globals)]
            match unsafe { CFNumberGetType(value) } {
                kCFNumberSInt64Type => {
                    let mut value_i64 = 0_i64;
                    let out_value: *mut i64 = &mut value_i64;
                    let converted =
                        unsafe { CFNumberGetValue(value, kCFNumberSInt64Type, out_value.cast()) };
                    if converted {
                        return DictEntryValue::_Number(value_i64);
                    }
                }
                kCFNumberSInt32Type => {
                    let mut value_i32 = 0_i32;
                    let out_value: *mut i32 = &mut value_i32;
                    let converted =
                        unsafe { CFNumberGetValue(value, kCFNumberSInt32Type, out_value.cast()) };
                    if converted {
                        return DictEntryValue::_Number(value_i32 as i64);
                    }
                }
                n => {
                    eprintln!("Unsupported Number of typeId: {}", n);
                }
            }
        } else if type_id == unsafe { CFBooleanGetTypeID() } {
            return DictEntryValue::_Bool(unsafe { CFBooleanGetValue(value.cast()) });
        } else if type_id == unsafe { CFStringGetTypeID() } {
            let str = nsstring_to_rust_string(value as *mut AnyObject);
            return DictEntryValue::_String(str);
        } else if type_id == unsafe { CFDictionaryGetTypeID() } && key == "kCGWindowBounds" {
            let rect: CGRect = unsafe {
                let mut rect = std::mem::zeroed();
                CGRectMakeWithDictionaryRepresentation(value.cast(), &mut rect);
                rect
            };

            return DictEntryValue::_Rect(Frame::from_cg_rect(&rect));
        } else {
            eprintln!("Unexpected type: {}", type_id);
        }
    }

    DictEntryValue::_Unknown
}

pub fn nsstring_to_rust_string(nsstring: *mut AnyObject) -> String {
    unsafe {
        let cstr: *const i8 = msg_send![nsstring, UTF8String];
        if !cstr.is_null() {
            std::ffi::CStr::from_ptr(cstr)
                .to_string_lossy()
                .into_owned()
        } else {
            "".into()
        }
    }
}

pub struct ActiveWindowInfo {
    pub window_id: i64,
    pub process_id: i64,
    pub app_name: String,
    pub frame: Frame,
    pub title: String,
    pub process_path: PathBuf,
}

pub fn get_active_window() -> Result<ActiveWindowInfo, ()> {
    const OPTIONS: CGWindowListOption =
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements;
    let window_list_info = unsafe { CGWindowListCopyWindowInfo(OPTIONS, kCGNullWindowID) };

    let windows_count: isize = unsafe { CFArrayGetCount(window_list_info) };

    let active_app = unsafe {
        let workspace = NSWorkspace::sharedWorkspace();
        workspace.frontmostApplication().unwrap()
    };

    let active_window_pid = unsafe { active_app.processIdentifier() as i64 };

    let mut win_pos = Frame::default();
    let mut win_title = String::from("");
    let mut app_name = String::from("");

    for i in 0..windows_count {
        let dic_ref = unsafe { CFArrayGetValueAtIndex(window_list_info, i) as CFDictionaryRef };

        if dic_ref.is_null() {
            continue;
        }

        let window_pid = get_from_dict(dic_ref, "kCGWindowOwnerPID");

        if let DictEntryValue::_Number(win_pid) = window_pid {
            if win_pid != active_window_pid {
                continue;
            }

            if let DictEntryValue::_Rect(window_bounds) = get_from_dict(dic_ref, "kCGWindowBounds")
            {
                if window_bounds.size.width < 50. || window_bounds.size.height < 50. {
                    continue;
                }

                win_pos = window_bounds;
            }

            if let DictEntryValue::_String(window_title) = get_from_dict(dic_ref, "kCGWindowName") {
                win_title = window_title;
            }

            if let DictEntryValue::_String(owner_name) =
                get_from_dict(dic_ref, "kCGWindowOwnerName")
            {
                app_name = owner_name;
            }

            let process_path: PathBuf = unsafe {
                let bundle_url = &active_app
                    .bundleURL()
                    .map(|url| url.path())
                    .unwrap()
                    .unwrap();
                PathBuf::from(&bundle_url.to_string())
            };

            if let DictEntryValue::_Number(window_id) = get_from_dict(dic_ref, "kCGWindowNumber") {
                let is_main = is_main_window(active_window_pid, window_id as u32);
                if !is_main {
                    continue;
                }

                let active_window = ActiveWindowInfo {
                    window_id,
                    process_id: active_window_pid,
                    app_name,
                    frame: win_pos,
                    title: win_title,
                    process_path,
                };

                unsafe { CFRelease(window_list_info as CFTypeRef) }

                return Ok(active_window);
            }
        }
    }

    unsafe { CFRelease(window_list_info as CFTypeRef) }

    Err(())
}
