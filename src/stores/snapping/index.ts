import type { NSScreen } from "@/models/cocoa/nsscreen";
import { Alignment } from "@/models/geometry/alignment";
import { Frame, Position, Size } from "@/models/geometry/frame";
import { ActiveSnapSide } from "@/models/snapping";
import { combine, createStore, sample } from "effector";
import * as settingsStore from "../settings";
import * as statusbarStore from "../statusbar";
import * as windowManagerStore from "../window-manager";
import { performHapticFeedbackFx } from "../system";

const _snapSides = [
  new ActiveSnapSide({
    alignment: Alignment.topCenter,
    frame: new Frame({ width: 1, height: 1 }, { x: 0, y: 0 }),
  }),
  new ActiveSnapSide({
    alignment: Alignment.centerLeft,
    frame: new Frame({ width: 0.5, height: 1 }, { x: 0, y: 0 }),
  }),
  new ActiveSnapSide({
    alignment: Alignment.centerRight,
    frame: new Frame({ width: 0.5, height: 1 }, { x: 0.5, y: 0 }),
  }),
  new ActiveSnapSide({
    alignment: Alignment.topLeft,
    frame: new Frame({ width: 0.5, height: 0.5 }, { x: 0, y: 0 }),
  }),
  new ActiveSnapSide({
    alignment: Alignment.bottomLeft,
    frame: new Frame({ width: 0.5, height: 0.5 }, { x: 0, y: 0.5 }),
  }),
  new ActiveSnapSide({
    alignment: Alignment.topRight,
    frame: new Frame({ width: 0.5, height: 0.5 }, { x: 0.5, y: 0 }),
  }),
  new ActiveSnapSide({
    alignment: Alignment.bottomRight,
    frame: new Frame({ width: 0.5, height: 0.5 }, { x: 0.5, y: 0.5 }),
  }),
];

const computeAreaFromScreen = ({
  frame,
  gap: windowGap,
  screen,
}: {
  frame?: Frame;
  screen: NSScreen;
  gap: number;
}): Frame | null => {
  if (frame == null || screen == null) {
    return null;
  }
  const gap = windowGap / 2;
  const screenVisibleFrame = screen.visibleFrame;
  const relativeTop =
    (screen?.visibleFrame.position.y ?? 0) - (screen?.frame.position.y ?? 0);
  const relativeLeft =
    (screen.visibleFrame.position.x ?? 0) - (screen?.frame.position.x ?? 0);

  const newFrame = new Frame(
    {
      width: screenVisibleFrame.size.width - gap * 2,
      height: screenVisibleFrame.size.height - gap * 2,
    },
    {
      x: screenVisibleFrame.position.x - gap,
      y: screenVisibleFrame.position.y - gap,
    },
  );

  return new Frame(
    new Size(
      newFrame.size.width * frame.size.width - gap * 2,
      newFrame.size.height * frame.size.height - gap * 2,
    ),
    new Position(
      relativeLeft + newFrame.size.width * frame.position.x + gap * 2,
      relativeTop + newFrame.size.height * frame.position.y + gap * 2,
    ),
  );
};

const $gap = settingsStore.$windowGap;
const $enabled = combine(
  [statusbarStore.$windowManagerEnabled, settingsStore.$windowManagerMode],
  ([enabled, mode]) => enabled && mode === "snapping",
);
const $sensitive = createStore(100);
const $placeholder = createStore<Frame | null>(null, { skipVoid: true });

sample({
  clock: windowManagerStore.$draggingPosition,
  filter: $enabled,
  source: {
    currentScreen: windowManagerStore.$currentCGScreen,
    gap: $gap,
    sensitive: $sensitive,
    placeholder: $placeholder,
  },
  fn: ({ currentScreen, gap, sensitive, placeholder }, point) => {
    if (!point || !currentScreen) {
      return null;
    }

    const area = _snapSides.find((area) => {
      const frame = computeAreaFromScreen({
        frame: area.frame,
        screen: currentScreen,
        gap: gap,
      });
      if (!frame) {
        return false;
      }
      const areaFromScreen = new ActiveSnapSide({
        frame: frame,
        alignment: area.alignment,
      });
      return areaFromScreen.checkDetection({
        screen: currentScreen,
        point: point,
        crop: sensitive,
      });
    });

    const newArea = computeAreaFromScreen({
      frame: area?.frame,
      screen: currentScreen,
      gap,
    });

    if (newArea?.hash === placeholder?.hash) {
      return placeholder;
    }

    return newArea;
  },
  target: $placeholder,
});

sample({
  clock: windowManagerStore.setWindowFrameFx,
  filter: $enabled,
  fn: () => null,
  target: $placeholder,
});

sample({
  clock: windowManagerStore.onDragEnded,
  filter: combine($enabled, $placeholder).map(([enabled, placeholder]) =>
    Boolean(enabled && placeholder),
  ),
  source: {
    placeholder: $placeholder,
    screen: windowManagerStore.$currentCGScreen,
  },
  fn: ({ screen, placeholder }, _) =>
    windowManagerStore.placeholderToScreen(screen!)(placeholder!),
  target: windowManagerStore.setWindowFrameFx,
});

sample({
  clock: $placeholder,
  filter: Boolean,
  target: performHapticFeedbackFx,
});

export { $placeholder };
