<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let active = false;
  export let label = "";

  const dispatch = createEventDispatcher();
</script>

<div class="wrapper">
  <button class="card" class:active on:click={() => dispatch("click")}>
    <slot />
  </button>
  {#if label}
    <div class="label" class:active>{label}</div>
  {/if}
</div>

<style lang="ts">
  .wrapper {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
  }
  .card {
    position: relative;
    outline: none;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, transparent, var(--color-panel) 12%);
    border: 1px solid
      color-mix(in srgb, transparent, var(--color-background) 60%);
    border-radius: var(--border-radius);
    background-color: color-mix(in srgb, transparent, var(--color-panel) 12%);
    width: 100%;
    height: 100px;

    &.active {
      outline: 3px solid
        color-mix(in srgb, transparent, var(--color-accent) 90%);
      outline-offset: 1px;
      background-color: color-mix(
        in srgb,
        transparent,
        var(--color-accent) 12%
      );
    }
  }
  .label {
    display: flex;
    align-items: center;
    margin-top: 8px;
    border-radius: 10em;
    padding: 0 6px;
    height: 18px;
    color: color-mix(in srgb, transparent, var(--color-text) 60%);
    font-size: 0.95rem;

    &.active {
      background-color: var(--color-accent);
      color: var(--color-text);
    }
  }
</style>
