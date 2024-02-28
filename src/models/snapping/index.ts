import type { NSScreen } from "../cocoa/nsscreen";
import { Alignment } from "../geometry/alignment";
import { Frame, type Position } from "../geometry/frame";

export class ActiveSnapSide {
  constructor({ frame, alignment }: { frame: Frame; alignment: Alignment }) {
    this.frame = frame;
    this.alignment = alignment;
  }

  frame: Frame;
  alignment: Alignment;

  checkDetection({
    screen,
    point,
    crop,
  }: {
    screen: NSScreen;
    point: Position;
    crop: number;
  }): boolean {
    const currentScreenFrame = screen.frame;
    const relativeScreenFrame = new Frame(currentScreenFrame.size, {
      x: 0,
      y: 0,
    });
    const intersectionFrame = relativeScreenFrame.alignmentFrameSize({
      size: {
        width: relativeScreenFrame.size.width - crop * 2,
        height: relativeScreenFrame.size.height - crop * 2,
      },
      alignment: Alignment.center,
    });
    const snapArea = relativeScreenFrame.alignmentFrameSize({
      size: {
        width: relativeScreenFrame.size.width / 3,
        height: relativeScreenFrame.size.height / 3,
      },
      alignment: this.alignment,
    });

    return (
      !intersectionFrame.includesPoint(point) && snapArea.includesPoint(point)
    );
  }
}
