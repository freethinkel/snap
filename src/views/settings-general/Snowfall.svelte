<script>
  import { FormGroup } from "@/components/form-group";
  import { Switch } from "@/components/switch";
  import * as settingsStore from "@/stores/settings";

  const snowfallEnabled = settingsStore.$snowfallEnabled;
</script>

<div class="wrapper">
  <FormGroup>
    <span slot="label">❄️ Winter</span>
    <Switch
      checked={$snowfallEnabled}
      on:change={({ detail }) => settingsStore.setSnowfallEnabled(detail)}
      >Snowfall enabled</Switch
    >
  </FormGroup>
</div>
