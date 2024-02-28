<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Icon } from "../icon";

  export let checked = false;

  const dispatch = createEventDispatcher();

  const handleChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    dispatch("change", input.checked);
    input.checked = checked;
  };
</script>

<label>
  <input
    type="checkbox"
    {checked}
    on:change={handleChange}
    class="visually-hidden"
  />
  <div class="checkbox">
    <Icon name="check" size={16} />
  </div>

  <div class="content">
    <slot />
  </div>
</label>

<style lang="postcss">
  label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .checkbox {
    --size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid color-mix(in srgb, transparent, var(--color-accent) 18%);
    border-radius: calc(var(--border-radius) / 1.6);
    width: var(--size);
    height: var(--size);

    & :global(.icon) {
      opacity: 0;
      filter: invert(1);
    }
    & :global(svg path) {
      stroke: var(--color-text);
    }
  }

  input:checked + .checkbox {
    border-color: var(--color-accent);
    background: var(--color-accent);
    & :global(.icon) {
      opacity: 1;
    }
  }
  input:focus + .checkbox,
  input:focus-visible + .checkbox {
    outline: 2px solid color-mix(in srgb, transparent, var(--color-accent));
    outline-offset: 1px;
  }
</style>
