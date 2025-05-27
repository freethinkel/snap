import { createStoreFromPromise } from "@/helpers";
import { NSHapticFeedback } from "@/models/cocoa/nshaptic-feedback";
import { webviewWindow } from "@tauri-apps/api";
import { getVersion } from "@tauri-apps/api/app";
import { createEffect } from "effector";

const key = webviewWindow.getCurrentWebviewWindow().label;

const $appVersion = createStoreFromPromise(getVersion());

const performHapticFeedbackFx = createEffect(() => {
  NSHapticFeedback.perform();
});

export { key, performHapticFeedbackFx, $appVersion };
