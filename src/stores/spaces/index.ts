import { createEffect, createEvent, sample } from "effector";
import { CGWindow } from "@/models/cocoa/nswindow";
import { invoke } from "@tauri-apps/api/core";
import { Frame, Position, Size } from "@/models/geometry/frame";
import type { NSScreen } from "@/models/cocoa/nsscreen";
import * as windowManagerStore from "../window-manager";
import * as settingsStore from "../settings";
import { listen } from "@tauri-apps/api/event";
import { IGNORED_WINDOWS } from "./ignored-apps";

const loadAllData = createEvent();
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

const generateFramesByRecursiveSplit = (windowCount: number): Frame[] => {
  if (windowCount <= 0) return [];

  // Start with full screen space
  const initialSpaces = [new Frame(new Size(1, 1), new Position(0, 0))];

  const splitSpaces = (spaces: Frame[], targetCount: number): Frame[] => {
    if (spaces.length >= targetCount) {
      return spaces.slice(0, targetCount);
    }

    // Calculate how many more spaces we need
    const spacesNeeded = targetCount - spaces.length;

    // Only split as many spaces as needed
    // Sort spaces by area (largest first) to split the biggest spaces first
    const sortedSpaces = [...spaces].sort(
      (a, b) => b.size.width * b.size.height - a.size.width * a.size.height,
    );

    const spacesToSplit = sortedSpaces.slice(0, spacesNeeded);
    const spacesToKeep = spaces.filter(
      (space) => !spacesToSplit.includes(space),
    );

    const newSpaces: Frame[] = [...spacesToKeep];

    for (const space of spacesToSplit) {
      // Decide whether to split horizontally or vertically
      // Split along the longer dimension to keep spaces roughly square
      const shouldSplitHorizontally = space.size.width >= space.size.height;

      if (shouldSplitHorizontally) {
        // Split horizontally (left and right)
        const leftWidth = space.size.width / 2;
        const rightWidth = space.size.width / 2;

        const leftFrame = new Frame(
          new Size(leftWidth, space.size.height),
          new Position(space.position.x, space.position.y),
        );

        const rightFrame = new Frame(
          new Size(rightWidth, space.size.height),
          new Position(space.position.x + leftWidth, space.position.y),
        );

        newSpaces.push(leftFrame, rightFrame);
      } else {
        // Split vertically (top and bottom)
        const topHeight = space.size.height / 2;
        const bottomHeight = space.size.height / 2;

        const topFrame = new Frame(
          new Size(space.size.width, topHeight),
          new Position(space.position.x, space.position.y),
        );

        const bottomFrame = new Frame(
          new Size(space.size.width, bottomHeight),
          new Position(space.position.x, space.position.y + topHeight),
        );

        newSpaces.push(topFrame, bottomFrame);
      }
    }

    return splitSpaces(newSpaces, targetCount);
  };

  return splitSpaces(initialSpaces, windowCount);
};

const arrangeWindowsOnCurrentScreenFx = createEffect(
  async ({
    windows: allWindows,
    screen,
    gap,
  }: {
    windows: CGWindow[];
    screen: NSScreen;
    gap: number;
  }) => {
    try {
      const predefinedFrames = [
        [new Frame(new Size(1, 1), new Position(0, 0))],
        [
          new Frame(new Size(0.5, 1), new Position(0, 0)),
          new Frame(new Size(0.5, 1), new Position(0.5, 0)),
        ],
        [
          new Frame(new Size(1 / 2, 1), new Position(0, 0)),
          new Frame(new Size(1 / 2, 1 / 2), new Position(1 / 2, 0)),
          new Frame(new Size(1 / 2, 1 / 2), new Position(1 / 2, 1 / 2)),
        ],
        [
          new Frame(new Size(0.5, 0.5), new Position(0, 0)),
          new Frame(new Size(0.5, 0.5), new Position(0.5, 0)),
          new Frame(new Size(0.5, 0.5), new Position(0, 0.5)),
          new Frame(new Size(0.5, 0.5), new Position(0.5, 0.5)),
        ],
        [
          new Frame(new Size(0.5, 0.5), new Position(0, 0)),
          new Frame(new Size(0.5, 0.5), new Position(0.5, 0)),
          new Frame(new Size(0.5, 0.5), new Position(0, 0.5)),
          new Frame(new Size(0.25, 0.5), new Position(0.5, 0.5)),
          new Frame(new Size(0.25, 0.5), new Position(0.75, 0.5)),
        ],
      ];

      const windows = allWindows.filter((win) => {
        const has = IGNORED_WINDOWS.some((ignoredWindow) => {
          if (typeof ignoredWindow === "string") {
            return ignoredWindow === win.name;
          }
          if (ignoredWindow instanceof RegExp) {
            return ignoredWindow.test(win.name);
          }
        });

        return !has;
      });

      // Use predefined frames for 1-5 windows, generate recursive split for 6+ windows
      let rawFrames: Frame[];
      if (windows.length <= 5) {
        rawFrames = predefinedFrames[windows.length - 1];
      } else {
        rawFrames = generateFramesByRecursiveSplit(windows.length);
      }

      if (!rawFrames?.length) {
        return;
      }

      const framesForWindows = rawFrames.map((frame) => {
        const placeholder = windowManagerStore.frameToPlaceholder({
          gap,
          screen: screen!,
        })(frame);

        return windowManagerStore.placeholderToScreen(screen!)(placeholder!);
      });

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
  fn: ({ screen, gap }, data) => ({
    ...data,
    windows: data.windows.filter((window) => {
      return (
        (window.is_main &&
          screen?.frame.includesPoint(window.frame.position)) ||
        screen?.frame.includesPoint(
          new Position(
            window.frame.position.x + window.frame.size.width,
            window.frame.position.y + window.frame.size.height,
          ),
        ) ||
        screen?.frame.includesPoint(
          new Position(
            window.frame.position.x + window.frame.size.width,
            window.frame.position.y,
          ),
        ) ||
        screen?.frame.includesPoint(
          new Position(
            window.frame.position.x,
            window.frame.position.y + window.frame.size.height,
          ),
        )
      );
    }),
    screen: screen!,
    gap,
  }),
  target: arrangeWindowsOnCurrentScreenFx,
});

listen("spaces_on_click_arrange", () => {
  arrangeWindowsOnCurrentScreen();
});

export { arrangeWindowsOnCurrentScreen };
