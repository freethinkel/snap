import { invoke } from "@tauri-apps/api/core";
import { Frame } from "@/models/geometry/frame";
import { type AnimationOptions } from "@/models/animation";
import * as settingsStore from "@/stores/settings";

export class AccessibilityElement {
  windowId!: number;
  pid!: number;
  frame!: Frame;

  static async checkPermission(): Promise<boolean> {
    const payload = (await invoke(
      "accessibility_element_check_permission",
    )) as boolean;
    return payload;
  }

  static async getUnderMouse(): Promise<AccessibilityElement | null> {
    const result: any = await invoke("accessibility_element_under_cursor");
    const accessibilityElement = new AccessibilityElement();

    accessibilityElement.frame = new Frame(
      result.frame.size,
      result.frame.position,
    );
    accessibilityElement.windowId = result.window_id;
    accessibilityElement.pid = result.pid;
    return accessibilityElement;
  }

  async setFrame(frame: Frame): Promise<void> {
    const animationOptions = settingsStore.getAnimationOptions();

    if (animationOptions) {
      await this.setFrameAnimated(frame, animationOptions);
    } else {
      await this.setFrameInstant(frame);
    }
  }

  /**
   * Set window frame with animation
   */
  async setFrameAnimated(
    frame: Frame,
    animationOptions?: AnimationOptions,
  ): Promise<void> {
    await invoke("accessibility_element_set_frame_animated", {
      windowInfo: {
        window_id: this.windowId,
        pid: this.pid,
        frame: frame,
      },
      animationOptions: animationOptions || null,
    });
  }

  /**
   * Set window frame instantly without animation
   */
  async setFrameInstant(frame: Frame): Promise<void> {
    await invoke("accessibility_element_set_frame_instant", {
      windowInfo: {
        window_id: this.windowId,
        pid: this.pid,
        frame: frame,
      },
    });
  }
}
