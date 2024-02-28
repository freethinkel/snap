<script lang="ts">
  import { FormGroup } from "@/components/form-group";
  import { SegmentedControl } from "@/components/segmented-control";
  import { SelectableCard } from "@/components/selectable-card";
  import * as settingsStore from "@/stores/settings";

  const placeholderMode = settingsStore.$placeholderMode;
  const setPlaceholderMode = settingsStore.setPlaceholderMode;
</script>

<FormGroup>
  <span slot="label">Placeholder mode</span>
  <div class="inner">
    <SelectableCard
      active={$placeholderMode === "blurred"}
      on:click={() => setPlaceholderMode("blurred")}
      label="Blurred"
    >
      <img class="windows" src="/assets/windows.svg" alt="windows" />
      <div class="blurred-card"></div>
    </SelectableCard>
    <SelectableCard
      active={$placeholderMode === "bordered"}
      on:click={() => setPlaceholderMode("bordered")}
      label="Bordered"
    >
      <img class="windows" src="/assets/windows.svg" alt="windows" />
      <div class="bordered-card"></div>
    </SelectableCard>
  </div>
</FormGroup>

<style lang="postcss">
  .inner {
    display: flex;
    gap: 8px;
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
  }
  .blurred-card {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    z-index: 1;
    backdrop-filter: blur(5px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    border-radius: calc(var(--border-radius) - 3px);
    background-color: color-mix(in srgb, transparent, var(--color-accent) 12%);
    width: 50%;
  }
  .windows {
    position: absolute;
    top: 0;
    left: 30px;
    width: 140px;
    height: 100%;
  }
</style>
