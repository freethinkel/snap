// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use patch_window::overlay::patch_overlay_window;
use tauri::{ActivationPolicy, Manager};
use tauri_plugin_nspopover::WindowExt;

mod commands;
mod data;
mod extensions;
mod patch_window;

use tauri_plugin_global_shortcut;

use crate::commands::{
    accessibility_element::{
        accessibility_element_check_permission, accessibility_element_set_frame,
        accessibility_element_under_cursor,
    },
    haptic_feedback::trigger_haptic_feedback,
    nscolor::{nscolor_get_accent, nscolor_listen_accent},
    nsevent::{
        nsevent_add_global_monitor_for_events, nsevent_mouse_location, nsevent_remove_monitor,
    },
    nsscreen::{nsscreen_get_screens, nsscreen_listen_change, nsscreen_main},
    nswindow::{cgwindow_get_on_screen, nswindow_set_frame},
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            app.set_activation_policy(ActivationPolicy::Accessory);

            let statusbar = app.get_webview_window("statusbar").unwrap();
            let overlay = app.get_webview_window("main").unwrap();
            patch_overlay_window(overlay);
            statusbar.to_popover();

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            nsscreen_get_screens,
            nsscreen_main,
            nsevent_mouse_location,
            nswindow_set_frame,
            nsevent_add_global_monitor_for_events,
            nsevent_remove_monitor,
            nscolor_get_accent,
            accessibility_element_under_cursor,
            accessibility_element_set_frame,
            accessibility_element_check_permission,
            trigger_haptic_feedback,
            nscolor_listen_accent,
            nsscreen_listen_change,
            cgwindow_get_on_screen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
