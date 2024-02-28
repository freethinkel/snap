<script lang="ts">
  import { getContext } from "svelte";
  import { CONTEXT_KEY, type SegmentedControlContext } from "./context";

  export let value: string;

  const context: SegmentedControlContext = getContext(CONTEXT_KEY);
  const onChange = context.onChange;
  const onControlTapDown = context.onControlTapDown;
  const onControlTapUp = context.onControlTapUp;

  const wrapValue = (fn: (val: typeof value) => void) => () => fn(value);

  const activeValue = context.value;
</script>

<button
  data-value={value}
  on:click={wrapValue(onChange)}
  on:mousedown={wrapValue(onControlTapDown)}
  on:mouseup={wrapValue(onControlTapUp)}
  class="segmented_control__button"
  class:active={$activeValue === value}
>
  <slot />
</button>

<style lang="postcss">
  button {
    position: relative;
    flex-grow: 1;
    appearance: none;
    z-index: 100;
    transition: var(--transition);
    margin: 0;
    border: none;
    background: none;
    padding: 0;
    min-height: 24px;
    color: inherit;
    color: var(--color-text);
    font-weight: 600;
    font-size: inherit;
  }
  button.active {
    color: color-mix(in srgb, transparent, var(--color-background) 80%);
  }
</style>
