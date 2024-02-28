<script>
  import { Icon } from "@/components/icon";
  import { Switch } from "@/components/switch";
  import * as caffeinateStore from "@/stores/statusbar/caffeinate";

  const enabled = caffeinateStore.$enabled;
  const setEnabled = caffeinateStore.onChangeCaffeinateModeClicked;
</script>

<div class="wrapper">
  <Switch checked={$enabled} on:change={({ detail }) => setEnabled(detail)}>
    <div class="switch_content">
      <Icon name="coffee" size={22} />
      Caffeinate
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
