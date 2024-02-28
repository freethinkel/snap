<script lang="ts">
  import { Icon } from "@/components/icon";
  import { createEventDispatcher } from "svelte";

  export let value: string;
  export let tabs: Array<{ value: string; icon?: string; label: string }> = [];

  const dispatch = createEventDispatcher();
</script>

<div data-tauri-drag-region class="wrapper">
  {#each tabs as tab}
    <button
      class="tab"
      class:active={tab.value === value}
      on:click={() => dispatch("change", tab.value)}
    >
      <Icon name={tab.icon} />
      <span>
        {tab.label}
      </span>
    </button>
  {/each}
</div>

<style lang="postcss">
  .wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    border-bottom: 1px solid
      color-mix(in srgb, transparent, var(--color-panel) 12%);
    padding: 0px 12px 8px;
    width: 100%;
    height: 100%;
  }
  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    appearance: none;
    transition: var(--transition);
    cursor: pointer;
    margin: 0;
    border: none;
    border-radius: var(--border-radius);
    background: transparent;
    padding: 6px 12px;
    height: 100%;
    color: color-mix(in srgb, transprent, var(--color-text) 80%);
    font-weight: 600;
    font-size: 0.9rem;

    & :global(.icon svg path) {
      stroke: var(--color-text);
    }

    &:hover {
      background: color-mix(in srgb, transparent, var(--color-panel) 10%);
    }
    &:active,
    &.active {
      background: color-mix(in srgb, transparent, var(--color-panel) 12%);
    }
  }
</style>
