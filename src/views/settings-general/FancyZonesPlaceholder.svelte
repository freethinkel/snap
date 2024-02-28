<script lang="ts">
  import { Checkbox } from "@/components/checkbox";
  import { FormGroup } from "@/components/form-group";
  import { Switch } from "@/components/switch";
  import * as settingsStore from "@/stores/settings";

  const showFancyZonesPlaceholder = settingsStore.$showFancyZonesPlaceholder;
  const setShowFancyZonesPlaceholder =
    settingsStore.setShowFancyZonesPlaceholder;
</script>

<FormGroup>
  <span slot="label">Placeholder</span>
  <Switch
    checked={$showFancyZonesPlaceholder}
    on:change={({ detail }) => setShowFancyZonesPlaceholder(detail)}
  >
    Enable fancy zones placeholder
  </Switch>
</FormGroup>
