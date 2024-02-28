<script lang="ts">
  import PlaceholderMode from "./PlaceholderMode.svelte";
  import FancyZonesPlaceholder from "./FancyZonesPlaceholder.svelte";
  import WindowGap from "./WindowGap.svelte";
  import WindowManager from "./WindowManager.svelte";
</script>

<div class="wrapper">
  <WindowGap />
  <FancyZonesPlaceholder />
  <WindowManager />
  <PlaceholderMode />
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
</style>
