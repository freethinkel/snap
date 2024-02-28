<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;
  const dispatch = createEventDispatcher();

  const onChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    dispatch("change", input.checked);
    input.checked = checked;
  };

  const size = 20;
  $: wrapperSize = size * 1.9;
</script>

<label
  style:--size={`${size}px`}
  style:--wrapper-size={`${wrapperSize}px`}
  class:active={true}
>
  <div class="inner">
    <slot />
  </div>

  <input
    {checked}
    on:change={onChange}
    class="visually-hidden"
    type="checkbox"
  />
  <div class="toggle">
    <div class="toggle__circle" />
  </div>
</label>

<style lang="postcss">
  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border-radius: var(--border-radius);
    padding: 4px;
    --transition: 0.1s;
  }

  .inner {
    flex-grow: 1;
  }

  .toggle {
    display: flex;
    transition: var(--transition);
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 20%);
    border-radius: 10em;
    background: color-mix(in srgb, transparent, var(--color-panel) 12%);
    width: var(--wrapper-size);

    &__circle {
      opacity: 0.8;
      transition: var(--transition);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 20%);
      border-radius: 10em;
      background: #fff;
      width: var(--size);
      height: var(--size);
    }
  }

  input:checked + .toggle .toggle__circle {
    transform: translateX(calc(var(--wrapper-size) - var(--size) - 2px));
    opacity: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
  input:checked + .toggle {
    background-color: var(--color-accent);
  }
</style>
