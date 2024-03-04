<script lang="ts">
  import PlaceholderMode from "./PlaceholderMode.svelte";
  import FancyZonesPlaceholder from "./FancyZonesPlaceholder.svelte";
  import WindowGap from "./WindowGap.svelte";
  import WindowManager from "./WindowManager.svelte";
  import * as systemStore from "@/stores/system";

  const appVersion = systemStore.$appVersion;
</script>

<div class="wrapper">
  <WindowGap />
  <FancyZonesPlaceholder />
  <WindowManager />
  <PlaceholderMode />
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
