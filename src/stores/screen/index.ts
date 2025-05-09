import { NSScreen } from "@/models/cocoa/nsscreen";
import { Frame, type Position } from "@/models/geometry/frame";
import { createStore, createEffect, sample } from "effector";

const frameToCgFrame = (frame: Frame): Frame => {
  const screens = $screens.getState();
  const mainScreen = screens[0];

  const mainScreenFrame = mainScreen?.frame;
  const point: Position = {
    x: frame.position.x,
    y:
      mainScreenFrame.position.y -
      frame.position.y -
      frame.size.height +
      mainScreenFrame.size.height,
  };

  return new Frame(frame.size, point);
};

const screenToCgScreen = (screen: NSScreen): NSScreen => {
  return new NSScreen(
    frameToCgFrame(screen.frame),
    frameToCgFrame(screen.visibleFrame),
  );
};

const getScreensFx = createEffect(() => {
  return NSScreen.screens();
});

const $screens = createStore<NSScreen[]>([]);

sample({
  clock: getScreensFx.doneData,
  target: $screens,
});

NSScreen.listenChange(() => {
  getScreensFx();
});

export { screenToCgScreen, $screens, getScreensFx };
