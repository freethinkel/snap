<script lang="ts">
  import { Placeholder } from "@/components/placeholder";
  import * as snappingStore from "@/stores/snapping";
  import * as settingsStore from "@/stores/settings";

  const frame = snappingStore.$placeholder;
  const mode = settingsStore.$placeholderMode;
</script>

{#if $frame}
  <Placeholder frame={$frame} mode={$mode} />
{/if}
