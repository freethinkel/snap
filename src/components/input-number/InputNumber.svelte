<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value: number;

  const dispatch = createEventDispatcher();

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    dispatch("change", Number(target.value));
    target.value = String(value);
  };
</script>

<label>
  <input
    type="number"
    on:change={handleChange}
    on:input={handleChange}
    {value}
    placeholder=""
  />
</label>

<style lang="postcss">
  input {
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 12%);
    border-radius: 10em;
    background: color-mix(in srgb, transparent, var(--color-panel) 12%);
    padding: 0 4px;
    width: 50px;
    height: 24px;
    font-size: 1rem;
  }
</style>
