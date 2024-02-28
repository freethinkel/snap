<div data-tauri-drag-region class="wrapper">
  <slot />
</div>

<style>
  .wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 70px;
    height: 28px;
    color: color-mix(in srgb, transparent, var(--color-text) 70%);
    font-weight: 600;
    font-size: 0.95rem;
  }
</style>
