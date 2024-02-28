import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export class NSColor {
  color!: string;

  static async getAccentColor(): Promise<NSColor> {
    const payload = await invoke("nscolor_get_accent");

    return { color: String(payload) };
  }

  private static _listener: UnlistenFn | null = null;
  static async listenChange(callback: (color: NSColor) => void) {
    if (this._listener) {
      this._listener();
    }

    invoke("nscolor_listen_accent");
    this._listener = await listen("nscolor_change", ({ payload }) => {
      callback({ color: String(payload) });
    });
  }
}
