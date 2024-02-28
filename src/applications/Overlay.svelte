<script lang="ts">
  import * as windowManagerStore from "@/stores/window-manager";
  import * as screensStore from "@/stores/screen";
  import * as statusbarStore from "@/stores/statusbar";
  import * as settingsStore from "@/stores/settings";
  import "@/stores/spaces";
  import "@/stores/mapping";
  import { Snapping, FancyZones } from "@/views";

  windowManagerStore.startWindowManagerListenFx();
  screensStore.getScreensFx();

  const mode = settingsStore.$windowManagerMode;
  const enabled = statusbarStore.$windowManagerEnabled;
</script>

{#if $enabled}
  {#if $mode === "fancy_zones"}
    <FancyZones />
  {:else if $mode === "snapping"}
    <Snapping />
  {/if}
{/if}
