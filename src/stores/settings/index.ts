import * as globalShortcut from "@tauri-apps/plugin-global-shortcut";

import { createSharedStore } from "@/helpers";
import { Frame } from "@/models/geometry/frame";
import { MappingAction, keysToShortcut } from "@/models/mapping";
import { getCurrent } from "@tauri-apps/api/webview";
import { createEffect, createEvent, createStore, sample } from "effector";
import { MAPPING_ACTIONS } from "./mapping-actions";
import * as autostartPlugin from "@tauri-apps/plugin-autostart";

const $windowGap = createSharedStore<number>("window_gap", 10);
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

const $placeholderMode = createSharedStore<"bordered" | "blurred">(
  "window_manager_placeholder_mode",
  "bordered",
);
const $autostartEnabled = createStore(false);

const mappingActivated = createEvent<MappingAction>();
const setMapping = createEvent<MappingAction>();
const setArrangeWindowShortcut = createEvent<string[] | null>();
const setWindowGap = createEvent<number>();
const setPlaceholderMode = createEvent<"bordered" | "blurred">();
const setWindowManagerMode = createEvent<"snapping" | "fancy_zones">();
const setShowFancyZonesPlaceholder = createEvent<boolean>();
const setAutostartEnabled = createEvent<boolean>();

if (getCurrent().label === "main") {
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
  clock: setPlaceholderMode,
  target: $placeholderMode,
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

export {
  $windowGap,
  $mappings,
  $showFancyZonesPlaceholder,
  $placeholderMode,
  $windowManagerMode,
  $arrangeWindowsShortcut,
  $autostartEnabled,
  setWindowManagerMode,
  mappingActivated,
  setWindowGap,
  setPlaceholderMode,
  setShowFancyZonesPlaceholder,
  setMapping,
  setArrangeWindowShortcut,
  setAutostartEnabled,
};
