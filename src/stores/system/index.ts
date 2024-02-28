import { NSHapticFeedback } from "@/models/cocoa/nshaptic-feedback";
import { webviewWindow } from "@tauri-apps/api";
import { createEffect } from "effector";

const key = webviewWindow.getCurrent().label;

const performHapticFeedbackFx = createEffect(() => {
  NSHapticFeedback.perform();
});

export { key, performHapticFeedbackFx };
