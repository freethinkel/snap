<script lang="ts">
  import { FormGroup } from "@/components/form-group";
  import { SegmentedControl } from "@/components/segmented-control";
  import { SelectableCard } from "@/components/selectable-card";
  import * as settingsStore from "@/stores/settings";

  const mode = settingsStore.$windowManagerMode;
  const setMode = settingsStore.setWindowManagerMode;
</script>

<FormGroup>
  <span slot="label">Window manager</span>
  <div class="inner">
    <SelectableCard
      active={$mode === "snapping"}
      on:click={() => setMode("snapping")}
      label="Snapping"
    >
      <img class="snapping" src="/assets/snapping.svg" alt="Snapping" />
      <img class="windows" src="/assets/windows.svg" alt="Windows" />

      <div class="bordered-card bordered-card__snapping"></div>
    </SelectableCard>
    <SelectableCard
      active={$mode === "fancy_zones"}
      on:click={() => setMode("fancy_zones")}
      label="Fancy zones"
    >
      <img
        class="fancy-zones"
        src="/assets/fancy-zones.svg"
        alt="Fancy zones"
      />
      <img class="windows" src="/assets/windows.svg" alt="Windows" />
      <div class="bordered-card"></div>
    </SelectableCard>
  </div>
</FormGroup>

<style lang="postcss">
  .inner {
    display: flex;
    gap: 8px;
    & :global(button) {
      overflow: hidden;
    }
  }
  .bordered-card {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    z-index: 1;
    border: 2px solid color-mix(in srgb, transparent, var(--color-accent) 12%);
    border-radius: calc(var(--border-radius) - 3px);
    background-color: color-mix(in srgb, transparent, var(--color-accent) 12%);
    width: 50%;
    &__snapping {
      top: 50%;
    }
  }
  .windows {
    position: absolute;
    top: 0;
    left: 30px;
    opacity: 0.6;
    width: 140px;
    height: 100%;
  }
  .snapping {
    position: absolute;
    bottom: -42px;
    left: -30px;
    z-index: 1;
    width: 100px;
  }
  .fancy-zones {
    position: absolute;
    top: 0;
    top: 5px;
    left: 30%;
    z-index: 2;
    width: 100px;
  }
</style>
