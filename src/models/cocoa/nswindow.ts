import type { Frame } from "@/models/geometry/frame";
import { invoke } from "@tauri-apps/api/core";

export class NSWindow {
  static async setFrame(frame: Frame): Promise<void> {
    await invoke("nswindow_set_frame", { frame });
  }

  static async setDecorations(label: string) {
    await invoke("nswindow_set_decorations", { label });
  }
}

export class CGWindow {
  frame!: Frame;
  id!: number;
  name!: string;
  pid!: number;

  static async getAllWindows(): Promise<CGWindow[]> {
    return invoke("cgwindow_get_on_screen");
  }
}
