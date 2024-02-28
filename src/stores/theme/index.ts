import { NSColor } from "@/models/cocoa/nscolor";
import { createEvent, createStore, sample } from "effector";

const $accentColor = createStore("rgb(21, 193, 216)");

const setAccentColor = createEvent<string>();

sample({
  clock: setAccentColor,
  target: $accentColor,
});

NSColor.getAccentColor().then(({ color }) => setAccentColor(color));
NSColor.listenChange(({ color }) => setAccentColor(color));

export { $accentColor };
