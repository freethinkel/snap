<script lang="ts">
  import { createEventDispatcher, setContext } from "svelte";
  import { CONTEXT_KEY, type SegmentedControlContext } from "./context";
  import { writable } from "svelte/store";

  export let value: string;
  const valueStore = writable(value);

  let slotsEl: HTMLElement;
  const dispatch = createEventDispatcher();

  const size = writable({ height: 0, width: 0 });
  const leftOffset = writable(0);
  const scale = writable(1);

  const computeHighlight = (element: HTMLElement) => {
    size.set({
      width: element.clientWidth,
      height: element.clientHeight,
    });
    leftOffset.set(element.offsetLeft);
  };

  const changeScale = (isTapDown: boolean) => scale.set(isTapDown ? 0.95 : 1);

  const onControlTapDown = () => {
    changeScale(true);
  };
  const onControlTapUp = (newValue: string) => {
    changeScale(false);
    if (newValue !== value) {
      dispatch("change", newValue);
    }
  };
  const onChange = (newValue: string) => {
    if (newValue !== value) {
      dispatch("change", newValue);
    }
  };

  $: {
    valueStore.set(value);
  }

  setContext(CONTEXT_KEY, {
    value: valueStore,
    onChange,
    onControlTapDown,
    onControlTapUp,
  } satisfies SegmentedControlContext);

  $: {
    setTimeout(() => {
      if (!value) {
        throw new Error("value is not set");
      }
      if (slotsEl) {
        const children = Array.from(slotsEl.children);
        const currentActive = children.find(
          (node) => node.getAttribute("data-value") === value,
        ) as HTMLElement | undefined;

        if (currentActive) {
          computeHighlight(currentActive);
        }
      }
    });
  }
</script>

<svelte:body on:mouseup={() => changeScale(false)} />

<div class="wrapper">
  {#if $size.width > 0}
    <div
      class="highlight"
      style:transform={`translateX(${$leftOffset}px) scale(${$scale})`}
      style:width={`${$size.width}px`}
      style:height={`${$size.height}px`}
    />
  {/if}
  <div class="slots" bind:this={slotsEl}>
    <slot />
  </div>
</div>

<style lang="postcss">
  .wrapper {
    position: relative;
  }

  .slots {
    display: flex;
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 8%);
    border-radius: calc(var(--border-radius) + 3px);
    background-color: color-mix(in srgb, transparent, var(--color-panel) 12%);
    padding: 3px;
  }

  .highlight {
    position: absolute;
    top: 4px;
    left: 0;
    transition: 0.22s cubic-bezier(0.65, 0, 0.35, 1);
    box-shadow:
      0 3px 4px rgba(0, 0, 0, 0.3),
      inset 0 0 2px 1px color-mix(in srgb, transparent, var(--color-panel) 12%);
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 20%);
    border-radius: var(--border-radius);
    background-size: cover;
    background-repeat: no-repeat;
    background-color: color-mix(in srgb, transparent, var(--color-panel) 50%);
    width: 100px;
    height: 100%;
  }
</style>
