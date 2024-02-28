<script>
  import { Button } from "@/components/button";
  import Caffeinate from "./Caffeinate.svelte";
  import WindowManager from "./WindowManager.svelte";
  import ArrangeWindows from "./ArrangeWindows.svelte";
</script>

<div class="wrapper">
  <WindowManager />
  <Caffeinate />
  <ArrangeWindows />
</div>

<style lang="postcss">
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
