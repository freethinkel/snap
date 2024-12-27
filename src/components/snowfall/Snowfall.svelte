<script lang="ts">
  import { onMount } from "svelte";

  let arr = Array(200).fill(0);

  const duration = 15;
  let render = Math.random();
</script>

<svelte:window on:resize={() => (render = Math.random())} />

{#key render}
  <div class="wrapper" style:--height="{window.innerHeight + 200}px">
    {#each arr as _}
      {@const scale = 0.5 + Math.random() * 1.5}
      <div
        class="snow"
        style:--left={Math.random() * 100}
        style:--duration="{duration -
          duration * 0.5 +
          Math.random() * duration * 0.5}s"
        style:--delay="{(Math.random() * duration) / 2}s"
        style:--scale={scale}
        style:--left-ini="{-20 + Math.random() * 20}vw"
        style:--left-end="{-20 + Math.random() * 20}vw"
        style:-webkit-filter={scale < 1 ? "blur(3px)" : "none"}
        style:--opacity={0.5 + Math.random() * 0.5}
      ></div>
    {/each}
  </div>
{/key}

<style>
  .wrapper {
    display: flex;
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    animation: fix-render 10s linear infinite;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    pointer-events: none;
  }
  .snow {
    display: flex;
    --size: 10px;
    position: absolute;
    top: -50px;
    left: calc(var(--left) * 1%);
    transform: scale(var(--scale));
    opacity: var(--opacity);
    animation: snowfall var(--duration) linear infinite;
    animation-delay: var(--delay);
    border-radius: 50%;
    background: white;
    width: var(--size);
    height: var(--size);
  }
  @keyframes fix-render {
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(0, 1px, 10px);
      opacity: 0.99;
    }
  }
  @keyframes snowfall {
    0% {
      transform: translate3d(var(--left-ini), 0, 0);
    }

    100% {
      transform: translate3d(var(--left-end), var(--height), 0);
    }
  }
</style>
