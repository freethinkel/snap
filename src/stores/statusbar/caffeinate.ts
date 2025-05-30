import { createSharedStore, wait } from "@/helpers";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Command } from "@tauri-apps/plugin-shell";
import { createEffect, createEvent, sample } from "effector";

const appWindow = getCurrentWindow();

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
    command.execute();

    await wait(400);
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
