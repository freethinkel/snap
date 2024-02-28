<script>
  import { Switch } from "@/components/switch";
  import { SegmentedControl } from "@/components/segmented-control";

  import { slide } from "svelte/transition";
  import * as statusbarStore from "@/stores/statusbar";
  import * as settingsStore from "@/stores/settings";
  import { Icon } from "@/components/icon";

  const enabled = statusbarStore.$windowManagerEnabled;
  const setEnabled = statusbarStore.setWindowManagerEnabled;
</script>

<div class="wrapper">
  <Switch checked={$enabled} on:change={({ detail }) => setEnabled(detail)}>
    <div class="switch_content">
      <Icon name="window" size={22} />
      Window manager
    </div>
  </Switch>
</div>

<style lang="postcss">
  .wrapper {
    & :global(label) {
      padding: 5px;
      &:hover {
        background-color: color-mix(
          in srgb,
          transparent,
          var(--color-panel) 12%
        );
      }
    }
  }
  .switch_content {
    display: flex;
    align-items: center;
    gap: 4px;

    & :global(.icon svg path) {
      fill: color-mix(in srgb, transparent, var(--color-panel) 20%);
      stroke: var(--color-text);
    }
  }
</style>
