import type { Frame } from "../geometry/frame";

export const keysToShortcut = (shortcut: string[]): string => {
  return shortcut
    .map(
      (char) =>
        ({
          Meta: "CommandOrControl",
          " ": "Space",
        })[char] || char,
    )
    .map((char) => (char.length === 1 ? char.toUpperCase() : char))
    .join("+");
};

export class MappingAction {
  get id(): string {
    return `S#${this.frame.size.width}:${this.frame.size.height}__P#${this.frame.position.x}:${this.frame.position.y}`;
  }
  constructor(
    public frame: Frame,
    public shortcut: string[],
  ) {}

  keysToShortcut() {
    return keysToShortcut(this.shortcut);
  }
}
