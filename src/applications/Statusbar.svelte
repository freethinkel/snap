<script lang="ts">
  import { Button } from "@/components/button";
  import * as statusbarStore from "@/stores/statusbar";
  import { StatusbarView, StatusbarFooter } from "@/views";
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
        <Button title="⌘ Q" on:click={() => statusbarStore.exitAppFx()}>
          Exit
        </Button>
      </div>
    </StatusbarFooter>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    height: 100vh;
  }

  .top {
    flex: 1;
    padding: 8px;
    min-height: 112px;
  }
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
  }
</style>
