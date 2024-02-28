<div class="wrapper">
  <div class="label">
    <slot name="label" />
  </div>
  <div class="children">
    <slot />
  </div>
  <div class="hint">
    <slot name="hint" />
  </div>
</div>

<style lang="postcss">
  .wrapper {
  }
  .label {
    margin: 10px;
    color: color-mix(in srgb, transparent, var(--color-text) 70%);
    font-weight: 600;
    font-size: 0.9rem;
  }
  .children {
    border: 1px solid color-mix(in srgb, transparent, var(--color-panel) 12%);
    border-radius: calc(var(--border-radius) + 10px);
    background-color: color-mix(in srgb, transparent, var(--color-panel) 12%);
    padding: 10px;
  }
</style>
