<script lang="ts">
  export let name = "";
  export let size = 24;

  let svgInner = "";

  const loadIcon = async (name: string) => {
    try {
      const module = await import(`./icons/${name}.svg?raw`);
      svgInner = module.default;
    } catch (err) {
      console.error(err);
    }
  };

  $: loadIcon(name);
</script>

<div class="icon" style:--size={`${size}px`}>
  {@html svgInner}
</div>

<style>
  .icon {
    display: flex;
  }
  .icon :global(svg) {
    width: var(--size);
    height: var(--size);
  }
</style>
