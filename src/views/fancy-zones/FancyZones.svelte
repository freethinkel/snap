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
    opacity: 0.9;
    backdrop-filter: blur(10px);
    animation: 10s fixBlur infinite alternate;
    transition: 0.2s ease-out transform;
    box-shadow:
      0 10px 10px 0 rgba(0, 0, 0, 0.12),
      0 4px 4px rgba(0, 0, 0, 0.12);
    border-radius: var(--border-radius);
    background-color: var(--color-background);
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
