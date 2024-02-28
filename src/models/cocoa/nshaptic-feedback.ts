import { invoke } from "@tauri-apps/api/core";

export class NSHapticFeedback {
  static async perform(): Promise<void> {
    await invoke("trigger_haptic_feedback");
  }
}
