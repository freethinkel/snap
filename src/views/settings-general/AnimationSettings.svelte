<script lang="ts">
  import { Switch } from "@/components/switch";
  import * as settingsStore from "@/stores/settings";

  const animationsEnabled = settingsStore.$animationsEnabled;

  const setAnimationsEnabled = settingsStore.setAnimationsEnabled;
</script>

<div class="wrapper">
  <div class="header">
    <h3 class="title">Animation Settings</h3>
    <p class="description">
      Configure smooth animations for window positioning and resizing
    </p>
  </div>

  <div class="setting">
    <Switch
      checked={$animationsEnabled}
      on:change={({ detail }) => setAnimationsEnabled(detail)}
    >
      Smooth window transitions when arranging windows
    </Switch>
  </div>
</div>

<style lang="postcss">
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 20%);
    border-radius: var(--border-radius);
    background: color-mix(in srgb, transparent, var(--color-panel) 8%);
    padding: 16px;
  }

  .header {
    .title {
      margin: 0 0 4px;
      color: var(--color-text);
      font-weight: 600;
      font-size: 1.1rem;
    }

    .description {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
      line-height: 1.4;
    }
  }

  .setting {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
