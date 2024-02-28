import { createEffect, createEvent, createStore, sample } from "effector";
import { type Space, Spaces, type SpacesInfo } from "@/models/cocoa/spaces";
import { CGWindow } from "@/models/cocoa/nswindow";
import { AccessibilityElement } from "@/models/cocoa/accessibility-element";
import { invoke } from "@tauri-apps/api/core";
import { Frame, Position, Size } from "@/models/geometry/frame";
import type { NSScreen } from "@/models/cocoa/nsscreen";
import * as windowManagerStore from "../window-manager";
import * as settingsStore from "../settings";
import { listen } from "@tauri-apps/api/event";

const $spacesInfo = createStore(null);
const $allWindows = createStore<CGWindow[]>([]);

const loadAllData = createEvent();
const arrangeWindowsOnScreen = createEvent<Space>();
const arrangeWindowsOnCurrentScreen = createEvent();

const loadAllDataFx = createEffect(async () => {
  const windows = await CGWindow.getAllWindows();

  return {
    windows,
  };
});

const setFrame = async (window: CGWindow, frame: Frame) => {
  await invoke("accessibility_element_set_frame", {
    windowInfo: {
      window_id: window.id,
      pid: window.pid,
      frame: frame,
    },
  });
};

const arrangeWindowsOnCurrentScreenFx = createEffect(
  async ({
    windows,
    screen,
    gap,
  }: {
    windows: CGWindow[];
    screen: NSScreen;
    gap: number;
  }) => {
    try {
      const frames = [
        [new Frame(new Size(1, 1), new Position(0, 0))],
        [
          new Frame(new Size(0.5, 1), new Position(0, 0)),
          new Frame(new Size(0.5, 1), new Position(0.5, 0)),
        ],
        [
          new Frame(new Size(1 / 6, 1), new Position(0, 0)),
          new Frame(new Size(2 / 3, 1), new Position(1 / 6, 0)),
          new Frame(new Size(1 / 6, 1), new Position(2 / 3 + 1 / 6, 0)),
        ],
        [
          new Frame(new Size(0.5, 0.5), new Position(0, 0)),
          new Frame(new Size(0.5, 0.5), new Position(0.5, 0)),
          new Frame(new Size(0.5, 0.5), new Position(0, 0.5)),
          new Frame(new Size(0.5, 0.5), new Position(0.5, 0.5)),
        ],
      ].map((frames) =>
        frames.map((frame) =>
          windowManagerStore.frameToPlaceholder({ gap, screen: screen! })(
            frame,
          ),
        ),
      );

      const framesForWindows = frames[windows.length - 1];
      if (!framesForWindows?.length) {
        return;
      }
      windows.forEach((window, i) => {
        setFrame(window, framesForWindows[i]);
      });
    } catch (err) {
      console.error(err);
    }
  },
);

sample({
  clock: arrangeWindowsOnCurrentScreen,
  target: loadAllData,
});

sample({
  clock: loadAllData,
  target: loadAllDataFx,
});

sample({
  clock: loadAllDataFx.doneData,
  source: {
    screen: windowManagerStore.$currentCGScreen,
    gap: settingsStore.$windowGap,
  },
  fn: ({ screen, gap }, data) => ({ ...data, screen: screen!, gap }),
  target: arrangeWindowsOnCurrentScreenFx,
});

listen("spaces_on_click_arrange", () => {
  arrangeWindowsOnCurrentScreen();
});

export { arrangeWindowsOnCurrentScreen };
