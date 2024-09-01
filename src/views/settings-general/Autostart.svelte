<script>
  import { FormGroup } from "@/components/form-group";
  import { Switch } from "@/components/switch";
  import * as settingsStore from "@/stores/settings";

  const isAutostartEnabled = settingsStore.$autostartEnabled;
</script>

<div class="wrapper">
  <FormGroup>
    <span slot="label">Autostart</span>
    <Switch
      checked={$isAutostartEnabled}
      on:change={({ detail }) => settingsStore.setAutostartEnabled(detail)}
      >Autostart</Switch
    >
  </FormGroup>
</div>
