use std::{
    collections::HashMap,
    ffi::c_void,
    path::PathBuf,
    ptr,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use once_cell::sync::Lazy;

use super::helpers::FromCgRect;

/// Thread-safe wrapper for AXUIElementRef
#[derive(Clone, Copy)]
pub struct SafeAXUIElement {
    process_id: i32,
    window_id: CGWindowID,
}

impl SafeAXUIElement {
    pub fn new(process_id: i32, window_id: CGWindowID) -> Self {
        Self {
            process_id,
            window_id,
        }
    }

    pub fn get_element(&self) -> Result<AXUIElementRef, ()> {
        get_window_from_id(self.process_id as i64, self.window_id)
    }
}

unsafe impl Send for SafeAXUIElement {}
unsafe impl Sync for SafeAXUIElement {}

/// Handle for managing animation lifecycle and cancellation
pub struct AnimationHandle {
    cancel_flag: Arc<AtomicBool>,
}

impl AnimationHandle {
    pub fn cancel(&self) {
        self.cancel_flag.store(true, Ordering::SeqCst);
    }
}

impl Drop for AnimationHandle {
    fn drop(&mut self) {
        // Signal cancellation
        self.cancel_flag.store(true, Ordering::SeqCst);
        // Don't join threads in drop to avoid deadlocks - threads will clean up themselves
        // when they check the cancel flag and exit naturally
    }
}

/// Global state for tracking active animations per window
static ANIMATION_STATE: Lazy<Mutex<HashMap<CGWindowID, AnimationHandle>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
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

#[derive(Clone)]
pub struct AnimationConfig {
    pub duration_ms: u64,
    pub fps: u64,
}

impl Default for AnimationConfig {
    fn default() -> Self {
        Self {
            duration_ms: 200,
            fps: 60,
        }
    }
}

/// Easing functions for smooth animations
#[derive(Clone, Copy)]
pub enum EasingFunction {
    Linear,
    EaseOutCubic,
    EaseInOutQuad,
}

impl EasingFunction {
    fn apply(&self, t: f64) -> f64 {
        match self {
            EasingFunction::Linear => t,
            EasingFunction::EaseOutCubic => 1.0 - (1.0 - t).powi(3),
            EasingFunction::EaseInOutQuad => {
                if t < 0.5 {
                    2.0 * t * t
                } else {
                    1.0 - (-2.0 * t + 2.0).powi(2) / 2.0
                }
            }
        }
    }
}

/// Get current window position
fn get_position(window: AXUIElementRef) -> Result<CGPoint, ()> {
    let mut position_ref: CFTypeRef = ptr::null();

    unsafe {
        let result = AXUIElementCopyAttributeValue(
            window,
            CFString::new(kAXPositionAttribute).as_concrete_TypeRef(),
            &mut position_ref as *mut CFTypeRef,
        );

        if result != kAXErrorSuccess || position_ref.is_null() {
            return Err(());
        }

        let mut point = CGPoint { x: 0.0, y: 0.0 };
        let value_ptr = &mut point as *mut _ as *mut c_void;

        if AXValueGetValue(
            position_ref as accessibility_sys::AXValueRef,
            kAXValueTypeCGPoint,
            value_ptr,
        ) {
            CFRelease(position_ref);
            Ok(point)
        } else {
            CFRelease(position_ref);
            Err(())
        }
    }
}

/// Get current window size
fn get_size(window: AXUIElementRef) -> Result<CGSize, ()> {
    let mut size_ref: CFTypeRef = ptr::null();

    unsafe {
        let result = AXUIElementCopyAttributeValue(
            window,
            CFString::new(kAXSizeAttribute).as_concrete_TypeRef(),
            &mut size_ref as *mut CFTypeRef,
        );

        if result != kAXErrorSuccess || size_ref.is_null() {
            return Err(());
        }

        let mut size = CGSize {
            width: 0.0,
            height: 0.0,
        };
        let value_ptr = &mut size as *mut _ as *mut c_void;

        if AXValueGetValue(
            size_ref as accessibility_sys::AXValueRef,
            kAXValueTypeCGSize,
            value_ptr,
        ) {
            CFRelease(size_ref);
            Ok(size)
        } else {
            CFRelease(size_ref);
            Err(())
        }
    }
}

/// Immediately set window position without animation
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

/// Immediately set window size without animation
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

/// Animate window position change
pub fn set_position_animated(
    window: AXUIElementRef,
    target_point: CGPoint,
    config: AnimationConfig,
) {
    // Get window ID for tracking
    let mut window_id: CGWindowID = 0;
    if unsafe { _AXUIElementGetWindow(window, &mut window_id) } != kAXErrorSuccess {
        // Fallback to immediate positioning if we can't get window ID
        set_position(window, target_point);
        return;
    }

    // Get process ID
    let process_id = match get_process_id_from_window(window) {
        Some(pid) => pid,
        None => {
            set_position(window, target_point);
            return;
        }
    };

    let safe_element = SafeAXUIElement::new(process_id, window_id);

    // Capture start position once before animation
    let start_point = get_position(window).unwrap_or(target_point);

    animate_window_property(
        window_id,
        safe_element,
        move |safe_window, progress, _| {
            if let Ok(window) = safe_window.get_element() {
                let eased_progress = EasingFunction::EaseInOutQuad.apply(progress);

                let current_x = start_point.x + (target_point.x - start_point.x) * eased_progress;
                let current_y = start_point.y + (target_point.y - start_point.y) * eased_progress;

                let current_point = CGPoint {
                    x: current_x,
                    y: current_y,
                };

                set_position(window, current_point);
            }
        },
        config,
    );
}

/// Animate window size change
pub fn set_size_animated(window: AXUIElementRef, target_size: CGSize, config: AnimationConfig) {
    // Get window ID for tracking
    let mut window_id: CGWindowID = 0;
    if unsafe { _AXUIElementGetWindow(window, &mut window_id) } != kAXErrorSuccess {
        // Fallback to immediate sizing if we can't get window ID
        set_size(window, target_size);
        return;
    }

    // Get process ID
    let process_id = match get_process_id_from_window(window) {
        Some(pid) => pid,
        None => {
            set_size(window, target_size);
            return;
        }
    };

    let safe_element = SafeAXUIElement::new(process_id, window_id);

    // Capture start size once before animation
    let start_size = get_size(window).unwrap_or(target_size);

    animate_window_property(
        window_id,
        safe_element,
        move |safe_window, progress, _| {
            if let Ok(window) = safe_window.get_element() {
                let eased_progress = EasingFunction::EaseInOutQuad.apply(progress);

                let current_width =
                    start_size.width + (target_size.width - start_size.width) * eased_progress;
                let current_height =
                    start_size.height + (target_size.height - start_size.height) * eased_progress;

                let current_size = CGSize {
                    width: current_width,
                    height: current_height,
                };

                set_size(window, current_size);
            }
        },
        config,
    );
}

/// Animate both window position and size simultaneously
pub fn set_frame_animated(
    window: AXUIElementRef,
    target_point: CGPoint,
    target_size: CGSize,
    config: AnimationConfig,
) {
    // Get window ID and process ID for tracking
    // Get window ID and process ID for tracking
    let mut window_id: CGWindowID = 0;
    if unsafe { _AXUIElementGetWindow(window, &mut window_id) } != kAXErrorSuccess {
        // Fallback to immediate positioning and sizing
        set_position(window, target_point);
        set_size(window, target_size);
        return;
    }

    // Extract process ID from the current window
    let process_id = match get_process_id_from_window(window) {
        Some(pid) => pid,
        None => {
            set_position(window, target_point);
            set_size(window, target_size);
            return;
        }
    };

    let safe_element = SafeAXUIElement::new(process_id, window_id);

    // Capture start values once before animation
    let start_point = get_position(window).unwrap_or(target_point);
    let start_size = get_size(window).unwrap_or(target_size);

    animate_window_property(
        window_id,
        safe_element,
        move |safe_window, progress, _| {
            if let Ok(window) = safe_window.get_element() {
                let eased_progress = EasingFunction::EaseInOutQuad.apply(progress);

                // Animate position
                let current_x = start_point.x + (target_point.x - start_point.x) * eased_progress;
                let current_y = start_point.y + (target_point.y - start_point.y) * eased_progress;
                let current_point = CGPoint {
                    x: current_x,
                    y: current_y,
                };

                // Animate size
                let current_width =
                    start_size.width + (target_size.width - start_size.width) * eased_progress;
                let current_height =
                    start_size.height + (target_size.height - start_size.height) * eased_progress;
                let current_size = CGSize {
                    width: current_width,
                    height: current_height,
                };

                set_position(window, current_point);
                set_size(window, current_size);
            }
        },
        config,
    );
}

/// Helper function to get process ID from AXUIElementRef
fn get_process_id_from_window(window: AXUIElementRef) -> Option<i32> {
    let mut pid: i32 = 0;
    let result = unsafe { accessibility_sys::AXUIElementGetPid(window, &mut pid) };
    if result == kAXErrorSuccess {
        Some(pid)
    } else {
        None
    }
}

/// Generic animation function that handles thread safety and cancellation
fn animate_window_property<F>(
    window_id: CGWindowID,
    safe_window: SafeAXUIElement,
    mut animation_fn: F,
    config: AnimationConfig,
) where
    F: FnMut(SafeAXUIElement, f64, bool) + Send + Copy + 'static,
{
    // Cancel any existing animation for this window
    let cancel_flag = Arc::new(AtomicBool::new(false));

    {
        let mut state = ANIMATION_STATE.lock().unwrap();
        // Cancel existing animation if it exists
        if let Some(existing) = state.get(&window_id) {
            existing.cancel();
        }

        // Store the new animation handle immediately
        let animation_handle = AnimationHandle {
            cancel_flag: cancel_flag.clone(),
        };
        state.insert(window_id, animation_handle);
    }

    let cancel_flag_clone = cancel_flag.clone();

    thread::spawn(move || {
        let total_frames = (config.duration_ms * config.fps / 1000).max(1);
        let frame_duration = Duration::from_millis(1000 / config.fps);

        for frame in 0..=total_frames {
            // Check if animation should be cancelled
            if cancel_flag_clone.load(Ordering::SeqCst) {
                break;
            }

            let progress = frame as f64 / total_frames as f64;
            let is_first_frame = frame == 0;

            thread::spawn(move || {
                animation_fn(safe_window, progress, is_first_frame);
            });

            if frame < total_frames {
                thread::sleep(frame_duration);
            }
        }

        // Remove this animation from the state when it completes or is cancelled
        let mut state = ANIMATION_STATE.lock().unwrap();
        // Only remove if it's still the same animation (check by cancel_flag address)
        if let Some(current) = state.get(&window_id) {
            if Arc::ptr_eq(&current.cancel_flag, &cancel_flag_clone) {
                state.remove(&window_id);
            }
        }
    });
}

/// Cancel all active animations
pub fn cancel_all_animations() {
    let mut state = ANIMATION_STATE.lock().unwrap();
    // Cancel all animations before clearing
    for (_, handle) in state.iter() {
        handle.cancel();
    }
    state.clear();
}

/// Cancel animation for a specific window
pub fn cancel_window_animation(window_id: CGWindowID) {
    let mut state = ANIMATION_STATE.lock().unwrap();
    if let Some(handle) = state.get(&window_id) {
        handle.cancel();
    }
    state.remove(&window_id);
}

/// Get the number of active animations (useful for testing)
pub fn get_active_animation_count() -> usize {
    let state = ANIMATION_STATE.lock().unwrap();
    state.len()
}

extern "C" {
    fn AXValueGetValue(
        value: accessibility_sys::AXValueRef,
        type_: accessibility_sys::AXValueType,
        value_ptr: *mut c_void,
    ) -> bool;
    fn CFRelease(cf: CFTypeRef);
}

extern "C" {
    fn _AXUIElementGetWindow(element: AXUIElementRef, window_id: *mut CGWindowID) -> AXError;
}

/// Example usage of the animation system:
///
/// ```rust
/// use cocoa::appkit::CGPoint;
/// use core_graphics::geometry::CGSize;
///
/// // Get window reference
/// let window = get_window_from_id(pid, window_id).unwrap();
///
/// // Animate to new position with custom config
/// let config = AnimationConfig {
///     duration_ms: 300,
///     fps: 60,
///     easing: EasingFunction::EaseOutCubic,
/// };
/// set_position_animated(window, CGPoint { x: 100.0, y: 100.0 }, config.clone());
///
/// // Animate to new size
/// set_size_animated(window, CGSize { width: 800.0, height: 600.0 }, config.clone());
///
/// // Animate both position and size simultaneously
/// set_frame_animated(
///     window,
///     CGPoint { x: 200.0, y: 150.0 },
///     CGSize { width: 1000.0, height: 700.0 },
///     config
/// );
///
/// // Cancel specific window animation
/// cancel_window_animation(window_id);
///
/// // Cancel all animations
/// cancel_all_animations();
/// ```
///
/// Features:
/// - Thread-safe: Multiple windows can be animated simultaneously
/// - Cancellable: Starting a new animation automatically cancels the previous one for that window
/// - Smooth easing: Multiple easing functions available
/// - No blocking: Animations run in background threads
/// - Automatic cleanup: Animation state is cleaned up when animations complete or are cancelled

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
