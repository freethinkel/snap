<script lang="ts">
  import type { Frame } from "@/models/geometry/frame";

  export let frame: Frame;
</script>

<div
  class="screen"
  style:--frame-width={frame.size.width}
  style:--frame-height={frame.size.height}
  style:--frame-x={frame.position.x}
  style:--frame-y={frame.position.y}
>
  <div class="frame" />
</div>

<style>
  .screen {
    --border-radius: 6px;
    --size: 30px;
    position: relative;
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 12%);
    border-radius: var(--border-radius);
    background: color-mix(in srgb, transparent, var(--color-panel) 12%);
    width: calc(var(--size) * 1.5);
    height: var(--size);
  }
  .frame {
    --padding: 2px;
    position: absolute;
    top: calc(var(--frame-y) * 100% + var(--padding));
    left: calc(var(--frame-x) * 100% + var(--padding));
    border-radius: calc(var(--border-radius) - var(--padding) - 1px);
    background: color-mix(in srgb, var(--color-accent), var(--color-panel) 60%);
    width: calc(var(--frame-width) * 100% - var(--padding) * 2);
    height: calc(var(--frame-height) * 100% - var(--padding) * 2);
  }
</style>
