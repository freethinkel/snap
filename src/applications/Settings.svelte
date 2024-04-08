<script lang="ts">
  import { Titlebar } from "@/components/titlebar";
  import { SettingsTabs } from "@/views";
  import { SettingsGeneral } from "@/views/settings-general";
  import { SettingsMapping } from "@/views/settings-mapping";

  import { writable } from "svelte/store";

  const activeTab = writable("general");
</script>

<div class="settings">
  <Titlebar>Settings</Titlebar>
  <div data-tauri-drag-region class="tabs">
    <SettingsTabs
      value={$activeTab}
      on:change={({ detail }) => ($activeTab = detail)}
      tabs={[
        { value: "general", icon: "settings", label: "General" },
        { value: "mappings", icon: "keyboard", label: "Mappings" },
      ]}
    />
  </div>

  {#if $activeTab === "general"}
    <SettingsGeneral />
  {:else if $activeTab === "mappings"}
    <SettingsMapping />
  {/if}
</div>

<style lang="postcss">
  .tabs {
    width: 100%;
  }
  .settings {
    display: flex;
    flex-direction: column;
    background: var(--color-background);
    width: 100%;
    height: 100%;
    min-height: inherit;
  }
</style>
