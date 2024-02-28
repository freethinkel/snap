#[cfg(not(debug_assertions))]
use cocoa::base::YES;
use cocoa::{
    appkit::{NSWindow, NSWindowCollectionBehavior},
    base::{id, NO},
};
use objc::{msg_send, sel, sel_impl};
use tauri::WebviewWindow;

pub fn patch_overlay_window(window: WebviewWindow) {
    unsafe {
        let ns_window = window.ns_window().unwrap() as id;

        let () = msg_send![ns_window, invalidateShadow];
        ns_window.setHasShadow_(NO);
        ns_window.setCollectionBehavior_(
            NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
        );
        #[cfg(not(debug_assertions))]
        {
            ns_window.setIgnoresMouseEvents_(YES);
            ns_window.setLevel_(20);
        }
    }
}
