import { Frame, Position, Size } from "@/models/geometry/frame";
import { combine, createEffect, createStore, sample } from "effector";
import * as statusbarStore from "../statusbar";
import * as windowManagerStore from "../window-manager";
import * as settingsStore from "../settings";
import { performHapticFeedbackFx } from "../system";

const defaultZones = [
  [new Frame({ width: 1, height: 1 }, { x: 0, y: 0 })],

  [
    new Frame({ width: 0.5, height: 1 }, { x: 0, y: 0 }),
    new Frame({ width: 0.5, height: 1 }, { x: 0.5, y: 0 }),
  ],

  [
    new Frame({ width: 1, height: 0.5 }, { x: 0, y: 0 }),
    new Frame({ width: 1, height: 0.5 }, { x: 0, y: 0.5 }),
  ],

  [
    new Frame({ width: 1 / 6, height: 1 }, { x: 0, y: 0 }),
    new Frame({ width: 2 / 3, height: 1 }, { x: 1 / 6, y: 0 }),
    new Frame({ width: 1 / 6, height: 1 }, { x: 1 / 6 + 2 / 3, y: 0 }),
  ],

  [
    new Frame({ width: 0.5, height: 0.5 }, { x: 0, y: 0 }),
    new Frame({ width: 0.5, height: 0.5 }, { x: 0.5, y: 0 }),
    new Frame({ width: 0.5, height: 0.5 }, { x: 0, y: 0.5 }),
    new Frame({ width: 0.5, height: 0.5 }, { x: 0.5, y: 0.5 }),
  ],

  [
    new Frame({ width: 2 / 3, height: 1 }, { x: 0, y: 0 }),
    new Frame({ width: 1 / 3, height: 1 }, { x: 2 / 3, y: 0 }),
  ],
];

const SETTINGS = {
  groupSize: new Size(80, 50),
  padding: 10.0,
  groupGap: 7.0,
};

const $enabled = combine(
  [statusbarStore.$windowManagerEnabled, settingsStore.$windowManagerMode],
  ([enabled, mode]) => enabled && mode === "fancy_zones",
);
const $placeholder = createStore<Frame | null>(null);
const $zones = createStore([...defaultZones]);
const $activeZone = createStore<Frame | null>(null);
const $activeTop = windowManagerStore.$currentCGScreen.map(
  (screen) =>
    (screen?.visibleFrame?.position?.y ?? 0) -
    (screen?.frame?.position?.y || 0) +
    15,
);
const $isDraggingTop = createStore(false);
const $gap = settingsStore.$windowGap;

sample({
  clock: windowManagerStore.$draggingPositionFromScreen,
  filter: $enabled,
  fn: (point) => Boolean(point?.y) && point!.y < 200,
  target: $isDraggingTop,
});

sample({
  clock: windowManagerStore.$draggingPositionFromScreen,
  filter: $enabled,
  source: {
    zones: $zones,
    screen: windowManagerStore.$currentScreen,
    activeTop: $activeTop,
  },
  fn: ({ screen, zones, activeTop }, point) => {
    if (!point) {
      return null;
    }

    const widthSum =
      SETTINGS.groupSize.width * zones.length +
      SETTINGS.groupGap * (zones.length - 1);

    const currentScreenFrame = screen?.frame;
    const startX = currentScreenFrame!.size.width / 2 - widthSum / 2;
    const zone = zones.find((_, index) => {
      return (
        point.x > startX &&
        point.x <
          startX +
            (SETTINGS.groupSize.width * (index + 1) + SETTINGS.groupGap * index)
      );
    });
    const offsetX =
      zones.indexOf(zone!) * (SETTINGS.groupSize.width + SETTINGS.groupGap);
    const frame = zone?.find((frame) => {
      const size = new Size(
        frame.size.width * SETTINGS.groupSize.width,
        frame.size.height * SETTINGS.groupSize.height,
      );
      const position = new Position(
        startX + offsetX + SETTINGS.groupSize.width * frame.position.x,
        activeTop +
          SETTINGS.padding +
          SETTINGS.groupSize.height * frame.position.y,
      );
      const computedFrame = new Frame(size, position);
      return computedFrame.includesPoint(point);
    });

    return frame || null;
  },
  target: $activeZone,
});

sample({
  clock: $activeZone,
  filter: $enabled,
  source: {
    screen: windowManagerStore.$currentCGScreen,
    gap: $gap,
  },
  fn: ({ screen, gap }, currentFrame) =>
    windowManagerStore.frameToPlaceholder({ gap, screen: screen! })(
      currentFrame!,
    ),
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
  fn: ({ placeholder, screen }, _) =>
    windowManagerStore.placeholderToScreen(screen!)(placeholder!),
  target: windowManagerStore.setWindowFrameFx,
});

sample({
  clock: windowManagerStore.onDragEnded,
  filter: $enabled,
  fn: () => null,
  target: windowManagerStore.$draggingPosition,
});

sample({
  clock: $activeZone,
  filter: Boolean,
  target: performHapticFeedbackFx,
});

export {
  $zones,
  $activeTop,
  $activeZone,
  $isDraggingTop,
  $placeholder,
  SETTINGS,
};
