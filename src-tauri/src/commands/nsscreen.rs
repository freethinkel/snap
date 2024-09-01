use std::sync::Mutex;

use crate::{
    data::{
        frame::{Frame, Point, Size},
        screen::Screen,
    },
    extensions::notification::NSNotificationCenter,
};
use tauri::{command, AppHandle, Emitter};

use cocoa::{
    self,
    appkit::NSScreen,
    base::{id, nil},
    foundation::NSArray,
};

fn nsscreen_to_screen(nsscreen: id) -> Screen {
    unsafe {
        let frame = NSScreen::frame(nsscreen);
        let visible_frame = NSScreen::visibleFrame(nsscreen);
        Screen {
            visible_frame: Frame {
                size: Size {
                    height: visible_frame.size.height,
                    width: visible_frame.size.width,
                },
                position: Point {
                    x: visible_frame.origin.x,
                    y: visible_frame.origin.y,
                },
            },
            frame: Frame {
                size: Size {
                    width: frame.size.width,
                    height: frame.size.height,
                },
                position: Point {
                    x: frame.origin.x,
                    y: frame.origin.y,
                },
            },
        }
    }
}

#[command]
pub fn nsscreen_get_screens() -> Option<Vec<Screen>> {
    unsafe {
        let screens = NSScreen::screens(nil);
        let mut frames: Vec<Screen> = vec![];
        (0..screens.count()).for_each(|i| {
            frames.push(nsscreen_to_screen(screens.objectAtIndex(i)));
        });

        Some(frames)
    }
}

#[command]
pub fn nsscreen_main() -> Option<Screen> {
    unsafe {
        let screen = NSScreen::mainScreen(nil);

        Some(nsscreen_to_screen(screen))
    }
}

static mut GLOBAL_OBSERVER: Option<NSNotificationCenter> = None;

#[command]
pub fn nsscreen_listen_change(app: AppHandle) {
    if let Some(notification) = unsafe { &GLOBAL_OBSERVER } {
        notification.stop();
    }
    let notification = NSNotificationCenter::new(String::from("NSNotificationCenter"));
    let app = Mutex::new(app);
    let notification = notification.listen(
        String::from("NSApplicationDidChangeScreenParametersNotification"),
        move |_| {
            let app = app.lock().unwrap();
            let _ = app.emit("nsscreen_change", "");
        },
    );

    unsafe {
        GLOBAL_OBSERVER = Some(notification);
    }
}
