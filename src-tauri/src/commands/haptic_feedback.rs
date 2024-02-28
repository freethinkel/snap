use cocoa::base::id;
use objc::{msg_send, runtime::Class, sel, sel_impl};
use tauri::command;

#[command]
pub fn trigger_haptic_feedback() {
    // Get the NSHapticFeedbackManager class
    let manager_class = Class::get("NSHapticFeedbackManager").unwrap();

    // Get the shared haptic feedback manager instance
    let manager: id = unsafe { msg_send![manager_class, defaultPerformer] };

    // Perform haptic feedback
    let performance_time: u64 = 0; // Use appropriate performance time
    let _: id =
        unsafe { msg_send![manager, performFeedbackPattern:1 performanceTime:performance_time] };
}
