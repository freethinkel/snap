<script lang="ts">
  import { FramePosition } from "@/components/frame-position";
  import { Icon } from "@/components/icon";
  import { ShortcutRecorder } from "@/components/shortcut-recorder";
  import { Frame, Position, Size } from "@/models/geometry/frame";
  import { MappingAction } from "@/models/mapping";
  import * as settingsStore from "@/stores/settings";

  const mappings = settingsStore.$mappings;
  const arrangeWindowsShortcut = settingsStore.$arrangeWindowsShortcut;

  const setArrangeWindowsShortcut = (shortcut: string[] | null) => {
    settingsStore.setArrangeWindowShortcut(shortcut);
  };

  const changeMapping = (mapping: MappingAction, newKeys: string[]) => {
    settingsStore.setMapping(new MappingAction(mapping.frame, newKeys));
  };
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th>Action</th>
        <th>Mapping</th>
      </tr>
    </thead>

    <tbody>
      {#each $mappings as mapping}
        <tr>
          <td>
            <FramePosition frame={mapping.frame} />
          </td>
          <td>
            <div class="shortcut">
              <ShortcutRecorder
                keys={mapping.shortcut}
                on:record={({ detail }) => changeMapping(mapping, detail)}
              />
            </div>
          </td>
        </tr>
      {/each}
      <tr>
        <td>
          <div class="arrange" title="Arrange windows">
            <FramePosition
              frame={new Frame(new Size(0, 0), new Position(0, 0))}
            />
            <Icon name="arrow-move" />
          </div>
        </td>
        <td>
          <div class="shortcut">
            <ShortcutRecorder
              keys={$arrangeWindowsShortcut ?? []}
              on:record={({ detail }) => setArrangeWindowsShortcut(detail)}
            />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<style lang="postcss">
  .wrapper {
    flex: 1;
    padding: 12px;
    min-height: 0;
    overflow: auto;
  }
  .arrange {
    position: relative;
    width: 45px;
    & :global(.icon) {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      & :global(svg path) {
        stroke: color-mix(in srgb, var(--color-accent), var(--color-panel) 60%);
      }
    }
  }
  table {
    border-collapse: collapse;
    width: 100%;
    text-align: left;
    & td:last-of-type,
    & th:last-of-type {
      text-align: right;
    }
  }

  .shortcut {
    display: flex;
    flex: 1;
    justify-content: flex-end;
  }
</style>
