export interface AnimationOptions {
  /**
   * Duration of the animation in milliseconds
   * @default 200
   */
  duration_ms?: number;

  /**
   * Frames per second for the animation
   * @default 60
   */
  fps?: number;
}

export const DEFAULT_ANIMATION_OPTIONS: AnimationOptions = {
  duration_ms: 200,
  fps: 120,
};
