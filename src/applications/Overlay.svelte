<script lang="ts">
  import * as windowManagerStore from "@/stores/window-manager";
  import * as screensStore from "@/stores/screen";
  import * as statusbarStore from "@/stores/statusbar";
  import * as settingsStore from "@/stores/settings";
  import "@/stores/spaces";
  import "@/stores/mapping";
  import "@/stores/statusbar";
  import { Snapping, FancyZones } from "@/views";
  import { check } from "@tauri-apps/plugin-updater";
  import { onMount } from "svelte";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { Snowfall } from "@/components/snowfall";

  windowManagerStore.startWindowManagerListenFx();
  screensStore.getScreensFx();

  const mode = settingsStore.$windowManagerMode;
  const enabled = statusbarStore.$windowManagerEnabled;
  const snowfallEnabled = settingsStore.$snowfallEnabled;

  const checkUpdate = async () => {
    const update = await check();
    if (update?.available && process.env.NODE_ENV === "production") {
      await update.downloadAndInstall();

      await relaunch();
    }
  };

  onMount(() => {
    checkUpdate();

    // Check every 1 hours
    setInterval(() => checkUpdate(), 1000 * 60 * 60 * 1);
  });
</script>

{#if $enabled}
  {#if $mode === "fancy_zones"}
    <FancyZones />
  {:else if $mode === "snapping"}
    <Snapping />
  {/if}
{/if}

{#if $snowfallEnabled}
  <Snowfall />
{/if}
