import { createSharedStore } from "@/helpers";
import { getCurrent } from "@tauri-apps/api/webview";
import { Command } from "@tauri-apps/plugin-shell";
import { createEffect, createEvent, sample } from "effector";

const appWindow = getCurrent();

const changeCaffeinateFx = createEffect(async (state: boolean) => {
  if (appWindow.label !== "main") {
    return;
  }

  const start = async () => {
    await stop();
    await Command.create("caffeinate", ["-di"]).spawn();
  };

  const stop = async () => {
    const command = Command.create("killall", ["caffeinate"]);
    await command.execute();
  };

  if (state) {
    await start();
  } else {
    await stop();
  }
});

const $enabled = createSharedStore("caffeinate_enabled", false);
const onChangeCaffeinateModeClicked = createEvent<boolean>();

sample({
  clock: onChangeCaffeinateModeClicked,
  target: $enabled,
});

sample({
  clock: $enabled,
  target: changeCaffeinateFx,
});

changeCaffeinateFx($enabled.getState());

export { $enabled, changeCaffeinateFx, onChangeCaffeinateModeClicked };
