use std::sync::Mutex;

use crate::extensions::{notification::NSNotificationCenter, nscolor::NSAColor};

use cocoa::base::nil;
use tauri::{command, AppHandle, Manager};

#[command]
pub fn nscolor_get_accent() -> String {
    unsafe {
        let color = NSAColor::accent_color(nil);

        return NSAColor::to_rgb(color);
    }
}

static mut GLOBAL_OBSERVER: Option<NSNotificationCenter> = None;

#[command]
pub fn nscolor_listen_accent(app: AppHandle) {
    if let Some(notification) = unsafe { &GLOBAL_OBSERVER } {
        notification.stop();
    }
    let notification = NSNotificationCenter::new(String::from("NSDistributedNotificationCenter"));
    let app = Mutex::new(app);
    let notification = notification.listen(
        String::from("AppleColorPreferencesChangedNotification"),
        move |_| {
            let app = app.lock().unwrap();
            let _ = app.emit("nscolor_change", nscolor_get_accent());
        },
    );

    unsafe {
        GLOBAL_OBSERVER = Some(notification);
    }
}
