import { createEffect, createEvent, sample } from "effector";

import { WebviewWindow, getCurrent } from "@tauri-apps/api/webviewWindow";
import * as caffeinateStore from "./caffeinate";
import { createSharedStore, wait } from "@/helpers";
import {
  startWindowManagerListenFx,
  stopWindowManagerListenFx,
} from "../window-manager";
import { exit } from "@tauri-apps/plugin-process";

const isOverlayWindow = getCurrent().label === "main";

const $windowManagerEnabled = createSharedStore(
  "window_manager_enabled",
  false,
);

// events
const onSettingsClick = createEvent();
const setWindowManagerEnabled = createEvent<boolean>();

const openSettingsWindowFx = createEffect(async () => {
  const settings = (() => {
    try {
      return new WebviewWindow("settings", {
        fullscreen: false,
        resizable: false,
        minimizable: false,
        width: 500,
        height: 650,
        titleBarStyle: "overlay",
        hiddenTitle: true,
        visible: false,
      });
    } catch (err) {
      return WebviewWindow.getByLabel("settings")!;
    }
  })();

  await wait(100);

  settings.setMinimizable(false);
  await settings.show();
  settings.setFocus();
});

const exitAppFx = createEffect(async () => {
  await caffeinateStore.changeCaffeinateFx(false);
  // PerformanceMeasure
  exit(0);
});

sample({
  clock: onSettingsClick,
  target: openSettingsWindowFx,
});

sample({
  clock: $windowManagerEnabled,
  filter: (value) => value && isOverlayWindow,
  target: startWindowManagerListenFx,
});

sample({
  clock: $windowManagerEnabled,
  filter: $windowManagerEnabled.map((e) => !e && isOverlayWindow),
  target: stopWindowManagerListenFx,
});

sample({
  clock: setWindowManagerEnabled,
  target: $windowManagerEnabled,
});

export {
  exitAppFx,
  onSettingsClick,
  $windowManagerEnabled,
  setWindowManagerEnabled,
};
