<script lang="ts">
  import type { Frame } from "@/models/geometry/frame";

  export let frame: Frame;
  export let gap = 0;
  export let isActive = false;

  const top = frame.position.y + gap / 2;
  const left = frame.position.x + gap / 2;
  const width = frame.size.width - gap;
  const height = frame.size.height - gap;
</script>

<div
  class="wrapper"
  class:active={isActive}
  style:--left={`${left}px`}
  style:--top={`${top}px`}
  style:--height={`${height}px`}
  style:--width={`${width}px`}
/>

<style lang="postcss">
  .wrapper {
    --border: var(--color-panel);
    --background: color-mix(in srgb, transparent, var(--color-panel) 50%);
    position: absolute;
    top: var(--top);
    left: var(--left);
    transform: scale(0.9);
    transition: 0.1s ease-out;
    border: 1px solid var(--border);
    border-radius: 6px;
    background-color: var(--background);
    width: var(--width);
    height: var(--height);
    overflow: hidden;
  }
  .active {
    --border: var(--color-accent);
    --background: color-mix(in srgb, transparent, var(--color-accent) 50%);
    transform: scale(1);
  }
</style>
