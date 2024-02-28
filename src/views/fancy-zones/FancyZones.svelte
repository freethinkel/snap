<script lang="ts">
  import * as fancyZonesStore from "@/stores/fancy-zones";
  import * as windowManagerStore from "@/stores/window-manager";
  import * as settingsStore from "@/stores/settings";
  import { Placeholder } from "@/components/placeholder";
  import { Frame } from "@/models/geometry/frame";
  import { FancyZoneRect } from "@/components/fancy-zone-rect";

  const zones = fancyZonesStore.$zones;
  const activeZone = fancyZonesStore.$activeZone;
  const isDraggingTop = fancyZonesStore.$isDraggingTop;
  const isDragging = windowManagerStore.$isDragging;
  const activeTop = fancyZonesStore.$activeTop;
  const groupSize = fancyZonesStore.SETTINGS.groupSize;
  const placeholder = fancyZonesStore.$placeholder;

  const showFancyZonesPlaceholder = settingsStore.$showFancyZonesPlaceholder;
  const mode = settingsStore.$placeholderMode;
</script>

{#if $showFancyZonesPlaceholder && $placeholder}
  <Placeholder frame={$placeholder} mode={$mode} />
{/if}

<div
  class="wrapper"
  class:show={$isDragging}
  class:active={$isDraggingTop}
  style:--top={`${$activeTop}px`}
>
  {#each $zones as zone}
    <div
      class="zone_group"
      style:--height={`${groupSize.height}px`}
      style:--width={`${groupSize.width}px`}
    >
      {#each zone as item}
        <FancyZoneRect
          isActive={item === $activeZone}
          frame={new Frame(
            {
              width: item.size.width * groupSize.width,
              height: item.size.height * groupSize.height,
            },
            {
              x: item.position.x * groupSize.width,
              y: item.position.y * groupSize.height,
            },
          )}
        />
      {/each}
    </div>
  {/each}
</div>

<style lang="postcss">
  .wrapper {
    display: flex;
    position: fixed;
    top: var(--top);
    left: 50%;
    gap: 5px;
    transform: translateX(-50%) translateY(-300%);
    opacity: 1 !important;
    backdrop-filter: blur(10px);
    animation: 10s fixBlur infinite alternate;
    transition: 0.2s ease-out transform;
    box-shadow:
      rgba(0, 0, 0, 0.25) 0px 54px 55px,
      rgba(0, 0, 0, 0.12) 0px -12px 30px,
      rgba(0, 0, 0, 0.12) 0px 4px 6px,
      rgba(0, 0, 0, 0.17) 0px 12px 13px,
      rgba(0, 0, 0, 0.09) 0px -3px 5px,
      inset 0 0 0 1px color-mix(in srgb, transparent, var(--color-panel) 10%);
    border-radius: calc(var(--border-radius) * 1.5);
    background-color: color-mix(
      in srgb,
      transparent,
      var(--color-background) 70%
    );
    padding: 8px;

    &.show {
      transform: translateX(-50%) translateY(-100%);
    }

    &.active {
      transform: translateX(-50%) translateY(0);
    }
  }

  /* fix rerender blur */
  @keyframes fixBlur {
    0% {
      opacity: 0.99999;
    }
    100% {
      opacity: 1;
    }
  }

  .zone_group {
    position: relative;
    width: var(--width);
    height: var(--height);
  }
</style>
