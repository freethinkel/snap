<script lang="ts">
  const arr = Array(200).fill(0);

  const duration = 15;
</script>

<div class="wrapper">
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

<style>
  .wrapper {
    position: fixed;
    right: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .snow {
    --size: 10px;
    position: absolute;
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
  @keyframes snowfall {
    0% {
      transform: translate3d(var(--left-ini), 0, 0);
    }

    100% {
      transform: translate3d(var(--left-end), 110vh, 0);
    }
  }
</style>
