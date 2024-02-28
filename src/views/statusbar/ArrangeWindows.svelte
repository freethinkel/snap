<script lang="ts">
  import { Button } from "@/components/button";
  import { Icon } from "@/components/icon";
  import { emit } from "@tauri-apps/api/event";

  const onClick = () => {
    setTimeout(() => {
      emit("spaces_on_click_arrange");
    });
  };
</script>

<div class="wrapper">
  <Button kind="outline" on:click={onClick}>
    <Icon name="arrow-move" />
    <span> Arrange windows</span>
  </Button>
</div>

<style>
  .wrapper {
    & :global(button) {
      gap: 4px;
      padding: 0 6px;
      width: 100%;
      height: 32px;
      & :global(svg path) {
        color: var(--color-text);
      }
    } /* padding: 5px; */
  }
</style>
