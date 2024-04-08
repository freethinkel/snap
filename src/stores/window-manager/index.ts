import type { NSScreen } from "@/models/cocoa/nsscreen";
import * as screensStore from "@/stores/screen";

import { Frame, Position, Size } from "@/models/geometry/frame";
import { NSWindow } from "@/models/cocoa/nswindow";
import {
  attach,
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
} from "effector";
import { NSEvent, NSEventType } from "@/models/cocoa/nsevent";
import { AccessibilityElement } from "@/models/cocoa/accessibility-element";
import { throttle } from "@/helpers";
import { getCurrent } from "@tauri-apps/api/webview";

const isOverlayWindow = getCurrent().label === "main";

type MouseEvent<T extends "down" | "up" | "dragged"> = {
  type: T;
  position: Position;
};

let MONITOR_ID: string | null = null;

const onMouseDown = createEvent<MouseEvent<"down">>();
const onMouseDragged = createEvent<MouseEvent<"dragged">>();
const onMouseUp = createEvent<MouseEvent<"up">>();
const onDragStarted = createEvent("onDragStarted");
const onDragEnded = createEvent("onDragEnded");

const startWindowManagerListenFx = createEffect(async () => {
  const onGlobalEvent = throttle(100)((event: NSEvent) => {
    switch (event.type) {
      case NSEventType.leftMouseDownMask:
        onMouseDown({ type: "down", position: event.position });
        break;
      case NSEventType.leftMouseUpMask:
        onMouseUp({ type: "up", position: event.position });
        break;
      case NSEventType.leftMouseDraggedMask:
        onMouseDragged({ type: "dragged", position: event.position });
        break;
    }
  });

  await AccessibilityElement.checkPermission();
  MONITOR_ID = await NSEvent.addGlobalMonitor(
    [
      NSEventType.leftMouseDownMask,
      NSEventType.leftMouseDraggedMask,
      NSEventType.leftMouseUpMask,
    ],
    onGlobalEvent,
  );
});

const stopWindowManagerListenFx = createEffect(async () => {
  if (MONITOR_ID) {
    await NSEvent.removeMonitor(MONITOR_ID);
  }
});

const getCurrentAccessibilityElementFx = createEffect(() =>
  AccessibilityElement.getUnderMouse(),
);

const setAccessibilityElementFrameFx = createEffect(
  async ({
    frame,
    element,
  }: {
    element: AccessibilityElement;
    frame: Frame;
  }) => {
    element.setFrame(frame);
  },
);

const $mousePosition = createStore<Position | null>(null)
  .on(onMouseDown, (_state, event) => event.position)
  .on(onMouseDragged, (_state, event) => event.position)
  .on(onMouseUp, () => null);

const $currentScreen = createStore<NSScreen | null>(null, {
  updateFilter: (update, current) =>
    !(current && update?.visibleFrame?.compare(current?.visibleFrame)),
})
  .on(screensStore.$screens, (_, screens) => screens[0])
  .on($mousePosition, (prevScreen, position) => {
    const screens = screensStore.$screens.getState();
    const mainScreen = screens[0];

    if (!position || !mainScreen) {
      return prevScreen;
    }
    const findedScreen = screens.find((screen) =>
      screensStore.screenToCgScreen(screen).frame.includesPoint(position),
    );
    return findedScreen ?? prevScreen ?? mainScreen;
  });

const $currentCGScreen = $currentScreen.map(
  (state) => state && screensStore.screenToCgScreen(state),
);

const $onMouseDownWindow = createStore<AccessibilityElement | null>(null);
const $currentWindow = createStore<AccessibilityElement | null>(null);

const $isDragging = createStore(false)
  .on(onDragStarted, () => true)
  .on(onDragEnded, () => false);
const $draggingPosition = createStore<Position | null>(null);
const $draggingPositionFromScreen = combine([
  $currentCGScreen,
  $draggingPosition,
]).map(([screen, offset]) => {
  if (offset != null) {
    const offsetPosition = screen?.frame.position!;

    return new Position(
      offset.x - offsetPosition.x,
      offset.y - offsetPosition.y,
    );
  }
  return null;
});

const setWindowFrameFx = attach({
  effect: setAccessibilityElementFrameFx,
  source: $currentWindow,
  mapParams: (frame: Frame, window) => ({
    frame,
    element: window!,
  }),
});

sample({
  clock: onMouseDragged,
  source: [$onMouseDownWindow, $currentWindow],
  filter([prev, curr], _) {
    const isDragging = $isDragging.getState();
    if (isDragging || !prev || !curr) return false;

    return (
      prev.frame.compareSize(curr.frame.size) &&
      !prev.frame.comparePosition(curr.frame.position)
    );
  },
  target: onDragStarted,
});

sample({
  clock: getCurrentAccessibilityElementFx.doneData,
  source: $onMouseDownWindow,
  fn: (_, clockData) => clockData,
  filter: (data) => !data,
  target: $onMouseDownWindow,
});

sample({
  clock: onMouseUp,
  fn: () => null,
  target: $onMouseDownWindow,
});

sample({
  clock: onMouseUp,
  filter: $isDragging,
  fn: () => false,
  target: onDragEnded,
});

sample({
  clock: onMouseDown,
  target: [getCurrentAccessibilityElementFx, screensStore.getScreensFx],
});

sample({
  clock: getCurrentAccessibilityElementFx.doneData,
  target: $currentWindow,
});

sample({
  clock: onMouseDragged,
  filter: $isDragging.map((s) => !s),
  target: getCurrentAccessibilityElementFx,
});

sample({
  clock: $mousePosition,
  filter: $isDragging,
  target: $draggingPosition,
});

if (isOverlayWindow) {
  $currentScreen.subscribe((screen) => {
    if (screen) {
      NSWindow.setFrame(screen.frame);
    }
  });
}

const placeholderToScreen =
  (screen: NSScreen) =>
  (placeholder: Frame): Frame => {
    const screenFrame = screen.frame;

    return new Frame(
      new Size(placeholder.size.width, placeholder.size.height),
      new Position(
        placeholder.position.x + screenFrame.position.x,
        placeholder.position.y + screenFrame.position.y,
      ),
    );
  };

type FrameToPlaceholderParameters = {
  gap: number;
  screen: NSScreen;
};

const frameToPlaceholder =
  ({ gap: windowGap, screen }: FrameToPlaceholderParameters) =>
  (frame: Frame): Frame => {
    const gap = windowGap / 2;

    const screenFrame = screen?.visibleFrame;
    const relativeTop =
      (screen?.visibleFrame.position.y ?? 0) - (screen?.frame.position.y ?? 0);
    const relativeLeft =
      (screen.visibleFrame.position.x ?? 0) - (screen?.frame.position.x ?? 0);

    if (frame && screenFrame) {
      const pseudoScreenFrame = new Frame(
        new Size(
          screenFrame.size.width - gap * 2,
          screenFrame.size.height - gap * 2,
        ),
        new Position(
          screenFrame.position.x - gap,
          screenFrame.position.y - gap,
        ),
      );
      const frameFromScreen = new Frame(
        new Size(
          pseudoScreenFrame.size.width * frame.size.width - gap * 2,
          pseudoScreenFrame.size.height * frame.size.height - gap * 2,
        ),
        new Position(
          relativeLeft +
            frame.position.x * pseudoScreenFrame.size.width +
            gap * 2,
          relativeTop +
            frame.position.y * pseudoScreenFrame.size.height +
            gap * 2,
        ),
      );
      return frameFromScreen || null;
    }

    return null as never;
  };

export {
  $currentScreen,
  $currentCGScreen,
  $currentWindow,
  $draggingPosition,
  $draggingPositionFromScreen,
  $isDragging,
  onDragEnded,
  onDragStarted,
  setWindowFrameFx,
  startWindowManagerListenFx,
  stopWindowManagerListenFx,
  getCurrentAccessibilityElementFx,
  placeholderToScreen,
  frameToPlaceholder,
};
