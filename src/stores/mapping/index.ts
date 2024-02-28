import { createEffect, sample } from "effector";
import * as settingsStore from "../settings";
import * as screensStore from "../screen";
import * as windowManagerStore from "../window-manager";
import { Position, Frame, Size } from "@/models/geometry/frame";
import { AccessibilityElement } from "@/models/cocoa/accessibility-element";

const $gap = settingsStore.$windowGap;

const setWindowFrameFx = createEffect(async (frame: Frame) => {
  await screensStore.getScreensFx();
  await windowManagerStore.getCurrentAccessibilityElementFx();

  await windowManagerStore.setWindowFrameFx(frame);
});

sample({
  clock: settingsStore.mappingActivated,
  source: {
    gap: $gap,
    window: windowManagerStore.$currentWindow,
    screen: windowManagerStore.$currentCGScreen,
  },
  fn: ({ gap, screen, window }, action) => {
    const placeholder = windowManagerStore.frameToPlaceholder({
      gap,
      screen: screen!,
    })(action.frame);
    let frame = windowManagerStore.placeholderToScreen(screen!)(placeholder);

    // TODO: Refactor this logic
    if (
      window?.frame.hash === frame.hash &&
      action.frame.size.height === 1 &&
      action.frame.size.width === 0.5
    ) {
      const placeholder = windowManagerStore.frameToPlaceholder({
        gap,
        screen: screen!,
      })(
        new Frame(
          new Size(2 / 3, 1),
          action.frame.position.x > 0
            ? new Position(1 / 3, action.frame.position.y)
            : action.frame.position,
        ),
      );
      frame = windowManagerStore.placeholderToScreen(screen!)(placeholder);
    }

    return frame;
  },
  target: setWindowFrameFx,
});

sample({
  clock: setWindowFrameFx.done,
  source: windowManagerStore.$currentWindow,
  fn: (window, { params: frame }) => {
    if (window) {
      const newWindow = new AccessibilityElement();
      newWindow.frame = frame;
      newWindow.pid = window.pid;
      newWindow.windowId = window.windowId;
      return newWindow;
    }
    return window;
  },
  target: windowManagerStore.$currentWindow,
});
