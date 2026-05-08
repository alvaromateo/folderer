<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { setIcon } from "obsidian";
  import type FoldererPlugin from "../../main";
  import type { MonitoredFolder } from "../folder-settings";
  import type { RuleData } from "../../types";
  import { RuleModal } from "../rule-modal";
  import RuleRow from "./RuleRow.svelte";

  interface Props {
    plugin: FoldererPlugin;
    folder: MonitoredFolder;
  }

  let { plugin, folder }: Props = $props();
  let rules = $state<RuleData[]>(untrack(() => [...folder.rules]));

  function syncRules(updated: RuleData[]) {
    rules = [...updated];
  }

  onMount(() => {
    folder.addRenderCallback(syncRules);
  });

  onDestroy(() => {
    folder.removeRenderCallback(syncRules);
  });

  async function deleteFolder() {
    plugin.settings.removeFolder(folder.path);
    await plugin.saveSettings();
  }

  function openAddRuleModal() {
    new RuleModal(plugin, folder, null).open();
  }

  function trashIcon(el: HTMLElement) {
    setIcon(el, "trash");
  }
</script>

<section class="folder-section">
  <div class="setting-item setting-item-heading">
    <div class="setting-item-info">
      <div class="setting-item-name">{folder.path}</div>
    </div>
    <div class="setting-item-control">
      <button
        class="clickable-icon extra-setting-button"
        onclick={deleteFolder}
        aria-label="Remove folder"
        use:trashIcon
      ></button>
    </div>
  </div>

  <div class="folderer_rules">
    {#each rules as rule, i (rule.id)}
      <RuleRow {plugin} {folder} {rule} index={i} totalRules={rules.length} />
    {/each}
  </div>

  <div class="setting-item">
    <div class="setting-item-info">
      <div class="setting-item-description">New automated rule for this folder</div>
    </div>
    <div class="setting-item-control">
      <button onclick={openAddRuleModal}>Add rule</button>
    </div>
  </div>
</section>

<style>
  .folder-section {
    margin-top: 2rem;
  }
</style>
