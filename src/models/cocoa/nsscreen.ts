import { Frame, Position } from "@/models/geometry/frame";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export class NSScreen {
  constructor(
    public frame: Frame,
    public visibleFrame: Frame,
  ) {}

  static async screenUnderMouse(): Promise<NSScreen> {
    const point: Position = await invoke("nsevent_mouse_location");
    const screens = await this.screens();

    return screens.find((screen) => screen.frame.includesPoint(point))!;
  }

  private static _listener: UnlistenFn | null = null;
  static async listenChange(callback: () => void) {
    if (this._listener) {
      this._listener();
    }

    invoke("nsscreen_listen_change");
    this._listener = await listen("nsscreen_change", () => {
      callback();
    });
  }

  static async screens(): Promise<Array<NSScreen>> {
    const screens = await invoke("nsscreen_get_screens");

    return (screens as []).map(
      (screen: any) =>
        new NSScreen(
          new Frame(screen.frame.size, screen.frame.position),
          new Frame(screen.visible_frame.size, screen.visible_frame.position),
        ),
    );
  }
}
