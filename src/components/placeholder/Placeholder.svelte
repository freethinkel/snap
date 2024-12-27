<script lang="ts">
  import { Frame, Position, Size } from "@/models/geometry/frame";
  import { fade } from "svelte/transition";

  export let frame: Frame;
  export let mode: "blurred" | "bordered" = "bordered";
</script>

{#if frame}
  <div
    transition:fade={{ duration: 150 }}
    class="rect"
    class:blurred={mode === "blurred"}
    class:bordered={mode === "bordered"}
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
    border-radius: var(--border-radius);
    width: var(--width);
    height: var(--height);
  }

  .bordered {
    border: 2px solid var(--color-accent);
    background-color: color-mix(in srgb, transparent, var(--color-accent) 12%);
  }

  .blurred {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: 1s fixBlur infinite alternate;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.24);
    background-color: color-mix(in srgb, transparent, var(--color-accent) 12%);
  }

  /* fix rerender blur */
  @keyframes fixBlur {
    0% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
</style>
