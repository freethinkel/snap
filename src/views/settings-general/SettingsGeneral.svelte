<script lang="ts">
  import FancyZonesPlaceholder from "./FancyZonesPlaceholder.svelte";
  import WindowGap from "./WindowGap.svelte";
  import WindowManager from "./WindowManager.svelte";
  import Autostart from "./Autostart.svelte";
  import * as systemStore from "@/stores/system";
  import Snowfall from "./Snowfall.svelte";

  const appVersion = systemStore.$appVersion;
</script>

<div class="wrapper">
  <Autostart />
  <Snowfall />
  <WindowGap />
  <FancyZonesPlaceholder />
  <WindowManager />
  <div class="footer">
    <div class="version">
      Version: {$appVersion}
    </div>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    overflow: auto;
  }
  .version {
    opacity: 0.7;
    margin: 10px 0 0;
    font-size: 0.9rem;
    text-align: center;
  }
</style>
