<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { derived, writable } from "svelte/store";
  import { Icon } from "../icon";

  const CONTROL_KEYS = ["Meta", "Control", "Shift", "Alt"];

  export let keys: string[] | readonly string[] = [];

  const pressedKeys = writable(new Set<string>());
  const unsubscribes: Array<() => void> = [];

  let isFocused = false;
  let element: HTMLButtonElement;

  const dispatch = createEventDispatcher();

  onMount(() => {
    window.addEventListener("blur", () => clear());
    unsubscribes.push(
      pressedKeys.subscribe((values) => {
        const newKeys = Array.from(values);
        const controlKeys = newKeys.filter((key) =>
          CONTROL_KEYS.map((key) => key.toLowerCase()).includes(
            key.toLowerCase(),
          ),
        );
        if (controlKeys.length > 0 && controlKeys.length < values.size) {
          dispatch("record", newKeys);
          element.blur();
        }
      }),
    );
  });

  onDestroy(() => {
    unsubscribes.forEach((callback) => callback());
  });

  const clear = () => pressedKeys.set(new Set());

  const onKeyDown = (event: KeyboardEvent) => {
    pressedKeys.update((store) => store.add(event.key));
    event.preventDefault();
  };

  $: {
    console.log($pressedKeys);
  }

  const onKeyUp = (event: KeyboardEvent) => {
    pressedKeys.update((codes) => {
      codes.delete(event.key);
      return codes;
    });
  };

  const onClick = (event: MouseEvent) => {
    const element = event.currentTarget as HTMLElement;
    setTimeout(() => {
      element.focus();
    });
  };

  const onBlur = () => {
    isFocused = false;
    clear();
  };

  const codes = derived(pressedKeys, (codes) => [...codes]);
</script>

<button
  class="wrapper"
  on:keydown={onKeyDown}
  on:keyup={onKeyUp}
  on:blur={onBlur}
  on:click={onClick}
  on:focus={() => (isFocused = true)}
  bind:this={element}
>
  {#if isFocused}
    {#if $codes.length}
      <div class="codes">
        {#each $codes as code}
          <kbd>{code}</kbd>
        {/each}
      </div>
    {:else}
      <span class="recording">Recording...</span>
    {/if}
  {:else if keys.length}
    <div class="codes">
      {#each keys as code}
        <kbd>{code}</kbd>
      {/each}
    </div>
    <button
      class="clear"
      on:click|stopPropagation={() => dispatch("record", [])}
    >
      <Icon name="close" size={14} />
    </button>
  {:else}
    <span class="placeholder">Record shortcurt</span>
  {/if}
</button>

<style lang="postcss">
  .wrapper {
    display: flex;
    align-items: center;
    appearance: none;
    transition: 0.1s ease-out;
    cursor: pointer;
    margin: 0;
    outline: none;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: var(--border-radius);
    background: color-mix(in srgb, transparent, var(--color-panel) 08%);
    padding: 0 8px;
    height: 32px;
    color: var(--color-text);
    font-size: 0.9rem;

    &:focus {
      border-color: var(--color-accent);
    }
  }
  .placeholder {
    opacity: 0.7;
  }
  .codes {
    display: flex;
    gap: 3px;

    & kbd {
      display: block;
      border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 12%);
      border-bottom-width: 2px;
      border-radius: 3px;
      background: color-mix(in srgb, transparent, var(--color-panel) 12%);
      padding: 2px;
      min-width: 19px;
      height: 19px;
      font-weight: bold;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
  }

  .clear {
    display: flex;
    justify-content: center;
    align-items: center;
    appearance: none;
    margin-left: 6px;
    border: none;
    border-radius: calc(var(--border-radius) / 2);
    background: var(--color-red);
    padding: 0;
    width: 16px;
    height: 16px;
    & :global(svg path) {
      stroke: var(--color-text);
      stroke-width: 3px;
    }
  }
</style>
