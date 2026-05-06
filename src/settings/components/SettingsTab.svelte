<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { Notice } from "obsidian";
  import type FoldererPlugin from "../../main";
  import { MonitoredFolder } from "../folder-settings";
  import FolderSection from "./FolderSection.svelte";

  interface Props {
    plugin: FoldererPlugin;
  }

  let { plugin }: Props = $props();

  let folders = $state<MonitoredFolder[]>(
    untrack(() => [...plugin.settings.monitoredFolders]),
  );
  let newFolderPath = $state("");

  function syncFolders(updated: MonitoredFolder[]) {
    folders = [...updated];
  }

  onMount(() => {
    plugin.settings.addRenderCallback(syncFolders);
  });

  onDestroy(() => {
    plugin.settings.removeRenderCallback(syncFolders);
  });

  async function addFolder() {
    const path = newFolderPath.trim();
    if (!path) return;
    if (plugin.settings.findFolder(path)) {
      new Notice(`"${path}" is already monitored.`);
      return;
    }
    plugin.settings.addFolder(new MonitoredFolder(path));
    await plugin.saveSettings();
    newFolderPath = "";
  }

  async function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      await addFolder();
    }
  }
</script>

<h2>Monitored Folders</h2>
<p class="setting-item-description">
  Add folders for which you want to automate actions. Each folder can have
  multiple rules configured.
</p>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Add folder</div>
  </div>
  <div class="setting-item-control">
    <input
      type="text"
      placeholder="Folder name"
      bind:value={newFolderPath}
      onkeydown={handleKeydown}
      aria-label="New folder path"
    />
    <button class="mod-cta" onclick={addFolder}>Add</button>
  </div>
</div>

<div class="folderer_folders">
  {#each folders as folder (folder.path)}
    <FolderSection {plugin} {folder} />
  {/each}
</div>
