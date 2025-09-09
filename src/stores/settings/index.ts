import * as globalShortcut from "@tauri-apps/plugin-global-shortcut";

import { createSharedStore } from "@/helpers";
import { Frame } from "@/models/geometry/frame";
import { MappingAction, keysToShortcut } from "@/models/mapping";
import { type AnimationOptions } from "@/models/animation";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createEffect, createEvent, createStore, sample } from "effector";
import { MAPPING_ACTIONS } from "./mapping-actions";
import * as autostartPlugin from "@tauri-apps/plugin-autostart";

const $windowGap = createSharedStore<number>("window_gap", 10);
const $snowfallEnabled = createSharedStore<boolean>("snowfall_enabled", false);
const $animationsEnabled = createSharedStore<boolean>(
  "animations_enabled",
  true,
);
const $mappings = createSharedStore("mappings", MAPPING_ACTIONS, {
  restoreMap: (data) =>
    (data as Array<object>).map(
      (item: any) =>
        new MappingAction(Frame.fromMap(item.frame), item.shortcut),
    ),
});
const $arrangeWindowsShortcut = createSharedStore<string[] | null>(
  "arrange_windows_shortcut",
  null,
);
const $windowManagerMode = createSharedStore<"snapping" | "fancy_zones">(
  "window_manager_mode",
  "snapping",
);
const $showFancyZonesPlaceholder = createSharedStore(
  "show_fancy_zones_placeholder",
  true,
);

const $autostartEnabled = createStore(false);

const mappingActivated = createEvent<MappingAction>();
const setMapping = createEvent<MappingAction>();
const setArrangeWindowShortcut = createEvent<string[] | null>();
const setWindowGap = createEvent<number>();
const setWindowManagerMode = createEvent<"snapping" | "fancy_zones">();
const setShowFancyZonesPlaceholder = createEvent<boolean>();
const setAutostartEnabled = createEvent<boolean>();
const setSnowfallEnabled = createEvent<boolean>();
const setAnimationsEnabled = createEvent<boolean>();

if (getCurrentWindow().label === "main") {
  let prevShortcut: string[] | null = null;
  $arrangeWindowsShortcut.subscribe(async (shortcut) => {
    if (prevShortcut?.length) {
      await globalShortcut.unregister(keysToShortcut(prevShortcut));
    }
    if (shortcut?.length) {
      globalShortcut.register(keysToShortcut(shortcut), () => {
        import("../spaces").then(({ arrangeWindowsOnCurrentScreen }) => {
          arrangeWindowsOnCurrentScreen();
        });
      });
    }

    prevShortcut = shortcut;
  });

  $mappings.subscribe(async (mappings) => {
    globalShortcut.unregisterAll();

    mappings
      .filter((mapping) => mapping.shortcut.length)
      .forEach((mapping) => {
        globalShortcut.register(mapping.keysToShortcut(), (event) => {
          if (event.state !== "Pressed") {
            return;
          }
          mappingActivated(mapping);
        });
      });
  });
}

sample({
  clock: setWindowGap,
  target: $windowGap,
});

sample({
  clock: setAnimationsEnabled,
  target: $animationsEnabled,
});

sample({
  clock: setShowFancyZonesPlaceholder,
  target: $showFancyZonesPlaceholder,
});

sample({
  clock: setMapping,
  source: $mappings,
  fn: (mappings, mapping) =>
    mappings.map((item) => {
      if (item.id === mapping.id) {
        return mapping;
      }
      return item;
    }),
  target: $mappings,
});

sample({
  clock: setArrangeWindowShortcut,
  target: $arrangeWindowsShortcut,
});

sample({
  clock: setWindowManagerMode,
  target: $windowManagerMode,
});

sample({
  clock: setAutostartEnabled,
  target: $autostartEnabled,
});

sample({
  clock: setSnowfallEnabled,
  target: $snowfallEnabled,
});

autostartPlugin.isEnabled().then((isEnabled) => {
  setAutostartEnabled(isEnabled);

  const setAutostartFx = createEffect((state: boolean) => {
    if (state) {
      autostartPlugin.enable();
    } else {
      autostartPlugin.disable();
    }
  });

  sample({
    clock: $autostartEnabled,
    target: setAutostartFx,
  });
});

const getAnimationOptions = (): AnimationOptions | null => {
  return null; // Fix the animation and return in the next versions

  const enabled = $animationsEnabled.getState();
  if (!enabled) return null;

  return {
    duration_ms: 200,
    fps: 120,
  };
};

export {
  $windowGap,
  $mappings,
  $showFancyZonesPlaceholder,
  $windowManagerMode,
  $arrangeWindowsShortcut,
  $autostartEnabled,
  $snowfallEnabled,
  $animationsEnabled,
  setSnowfallEnabled,
  setWindowManagerMode,
  mappingActivated,
  setWindowGap,
  setShowFancyZonesPlaceholder,
  setMapping,
  setArrangeWindowShortcut,
  setAutostartEnabled,
  setAnimationsEnabled,
  getAnimationOptions,
};
