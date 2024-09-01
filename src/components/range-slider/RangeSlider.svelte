<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value = 0;
  export let step = 1;

  let wrapperRef: HTMLDivElement;
  let offsetLeft = 0;
  const size = 20;

  $: {
    offsetLeft = value;
  }

  const dispatch = createEventDispatcher();
  const clamp = (number: number, min: number, max: number) =>
    Math.min(Math.max(number, min), max);

  const onDrag = (event: MouseEvent) => {
    const wrapperRect = wrapperRef.getBoundingClientRect();
    const value =
      clamp(
        event.clientX - (wrapperRect.left + size / 2),
        0,
        wrapperRect.width - size,
      ) /
      (wrapperRect.width - size);

    offsetLeft = Math.round(value * (100 / step)) / (100 / step);
    dispatch("change", offsetLeft);
  };
  const listenDragging = () => {
    const onMouseUp = () => {
      unlistenDragging();
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onDrag);
  };
  const unlistenDragging = () => {
    document.removeEventListener("mousemove", onDrag);
  };
  const onMouseDown = () => {
    listenDragging();
  };
</script>

<div
  class="wrapper"
  bind:this={wrapperRef}
  style:--size="{size}px"
  style:--offset={Math.max(Math.min(offsetLeft, 1), 0)}
>
  <div class="line" />
  <div class="line__active" />
  <div class="thumb__wrapper">
    <button
      tabindex="0"
      class="thumb"
      on:mousedown={onMouseDown}
      type="button"
    />
  </div>
</div>

<style lang="postcss">
  .wrapper {
    display: flex;
    position: relative;
    width: 100%;
    height: var(--size);
  }
  .line {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border-radius: var(--size);
    background-color: color-mix(in srgb, transparent, var(--color-panel) 50%);
    width: 100%;
    height: 4px;
  }
  .line__active {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border-radius: var(--size);
    background-color: var(--color-accent);
    width: calc(var(--offset) * 100%);
    height: 4px;
  }
  .thumb__wrapper {
    position: absolute;
    left: calc(var(--offset) * 100% - var(--size) * var(--offset));
  }
  .thumb {
    appearance: none;
    transition: 0.1s ease-out transform;
    outline: none;
    box-shadow:
      0 4px 4px 0 rgba(0, 0, 0, 0.12),
      0 8px 8px 0 rgba(0, 0, 0, 0.12),
      inset 0 0 0 1px rgba(255, 255, 255, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.12);
    border: 1px solid var(--color-border);
    border-radius: var(--size);
    background-color: #fff;
    padding: 0;
    width: var(--size);
    min-width: var(--size);
    height: var(--size);

    &:active {
      transform: scale(1.2);
    }
  }
</style>
