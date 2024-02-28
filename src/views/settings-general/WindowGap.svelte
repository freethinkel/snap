<script lang="ts">
  import { FormGroup } from "@/components/form-group";
  import { InputNumber } from "@/components/input-number";
  import { RangeSlider } from "@/components/range-slider";
  import * as settingsStore from "@/stores/settings";

  const windowGap = settingsStore.$windowGap;
</script>

<div class="group">
  <div class="group__inner">
    <FormGroup>
      <span slot="label">Window gap</span>
      <div class="inner">
        <RangeSlider
          on:change={({ detail }) => settingsStore.setWindowGap(detail * 100)}
          step={5}
          value={$windowGap / 100}
        />
        <InputNumber
          on:change={({ detail }) => settingsStore.setWindowGap(detail)}
          value={$windowGap}
        />
      </div>
    </FormGroup>
  </div>
</div>

<style lang="postcss">
  .inner {
    display: flex;
    align-items: center;
    gap: 10px;
  }
</style>
