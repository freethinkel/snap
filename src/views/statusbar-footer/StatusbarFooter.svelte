<footer>
  <slot name="left" />
  <slot name="right" />
</footer>

<style>
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid
      color-mix(in srgb, transparent, var(--color-panel) 12%);
    background-color: color-mix(in srgb, transparent, var(--color-panel) 18%);
    padding: 2px 10px 4px;
  }
</style>
