<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let type: "button" | "submit" = "button";
  export let kind: "text" | "primary" | "outline" = "text";
  export let title = "";
  export let disabled = false;

  const dispatch = createEventDispatcher();
</script>

<button
  {type}
  {disabled}
  {title}
  on:click={(event) => dispatch("click", event)}
  class="button kind__{kind}"
>
  <slot />
</button>

<style lang="postcss">
  .button {
    appearance: none;
    transition: var(--transition);
    cursor: pointer;
    margin: 0;
    border: none;
    background: none;
    padding: 0;
    color: inherit;
    font-size: 1rem;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  .kind {
    &__text {
      font-weight: 600;
      &:hover {
        opacity: 0.8;
      }
    }
    &__outline {
      display: flex;
      align-items: center;
      border-radius: var(--border-radius);
      background: transparent;
      padding: 0 12px;
      height: 28px;
      color: var(--color-text);
      font-weight: 600;
      &:hover {
        background: color-mix(in srgb, transparent, var(--color-panel) 12%);
      }
      &:active {
        transform: scale(0.97);
      }
    }
    &__primary {
      display: flex;
      align-items: center;
      border-radius: var(--border-radius);
      background-color: var(--color-accent);
      padding: 0 12px;
      height: 28px;
      color: var(--color-text);
      font-weight: 600;
      &:hover {
        transform: scale(0.97);
      }
      &:active {
        transform: scale(0.9);
      }
    }
  }
</style>
