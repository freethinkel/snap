import "./styles.pcss";

import Overlay from "@/applications/Overlay.svelte";
import Statusbar from "@/applications/Statusbar.svelte";
import Settings from "@/applications/Settings.svelte";

import * as themeStore from "@/stores/theme";

import * as systemStore from "./stores/system";

const key = systemStore.key;

const handler = {
  main: (el: HTMLElement) => new Overlay({ target: el }),
  statusbar: (el: HTMLElement) => new Statusbar({ target: el }),
  settings: (el: HTMLElement) => new Settings({ target: el }),
}[key];

if (handler) {
  const el = document.getElementById("app")!;

  handler(el);
}

themeStore.$accentColor.subscribe((color) => {
  document.body.attributeStyleMap.set("--color-accent", color);
});

document.body.classList.add(`env__${process.env.NODE_ENV}`);

if (process.env.NODE_ENV === "production") {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
}
