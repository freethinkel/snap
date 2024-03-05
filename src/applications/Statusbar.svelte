<script lang="ts">
  import { Button } from "@/components/button";
  import * as statusbarStore from "@/stores/statusbar";
  import { StatusbarView, StatusbarFooter } from "@/views";
  import { getCurrent } from "@tauri-apps/api/webview";
</script>

<div class="wrapper statusbar__frame">
  <div class="top">
    <StatusbarView />
  </div>

  <div class="footer">
    <StatusbarFooter>
      <div slot="left">
        <Button on:click={() => statusbarStore.onSettingsClick()}>
          Settings
        </Button>
      </div>
      <div slot="right">
        <Button on:click={() => statusbarStore.exitAppFx()}>⌘ Q</Button>
      </div>
    </StatusbarFooter>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    animation: fix 10s infinite;
    height: 100%;
    min-height: inherit;
  }

  @keyframes fix {
    0% {
      transform: translateY(-0.1%);
    }
    100% {
      transform: translateY(0%);
    }
  }
  .top {
    flex: 1;
    padding: 8px;
    min-height: 112px;
  }
</style>
