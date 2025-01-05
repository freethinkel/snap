<script lang="ts">
  import { Frame, Position, Size } from "@/models/geometry/frame";
  import { fade } from "svelte/transition";

  export let frame: Frame;
</script>

{#if frame}
  <div
    transition:fade={{ duration: 150 }}
    class="rect"
    style:--width={`${frame.size.width}px`}
    style:--height={`${frame.size.height}px`}
    style:--x={`${frame.position.x}px`}
    style:--y={`${frame.position.y}px`}
  />
{/if}

<style lang="postcss">
  .rect {
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(var(--x), var(--y));
    transition:
      0.1s ease-out transform,
      0.1s ease-out height,
      0.1s ease-out width;
    border: 2px solid var(--color-accent);
    border-radius: var(--border-radius);
    background-color: color-mix(in srgb, transparent, var(--color-accent) 12%);
    width: var(--width);
    height: var(--height);
  }
</style>
