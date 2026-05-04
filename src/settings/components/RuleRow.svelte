<script lang="ts">
  import { setIcon } from "obsidian";
  import type FoldererPlugin from "../../main";
  import type { MonitoredFolder } from "../monitored-folder";
  import type { Rule } from "../../types";
  import { RuleModal } from "../rule-modal";

  interface Props {
    plugin: FoldererPlugin;
    folder: MonitoredFolder;
    rule: Rule;
  }

  let { plugin, folder, rule }: Props = $props();

  async function toggleEnabled() {
    folder.modifyRule({ ...$state.snapshot(rule), enabled: !rule.enabled });
    await plugin.saveSettings();
  }

  function openEditModal() {
    new RuleModal(plugin, folder, rule).open();
  }

  async function deleteRule() {
    folder.removeRule(rule.id);
    await plugin.saveSettings();
  }

  function pencilIcon(el: HTMLElement) {
    setIcon(el, "pencil");
  }

  function trashIcon(el: HTMLElement) {
    setIcon(el, "trash");
  }

  function chevronUpIcon(el: HTMLElement) {
    setIcon(el, "chevron-up");
  }

  function chevronDownIcon(el: HTMLElement) {
    setIcon(el, "chevron-down");
  }
</script>

<div class="setting-item">
  <div class="setting-item-control ordering-controls">
    <div>
      <button
        class="clickable-icon extra-setting-button"
        onclick={() => {}}
        aria-label="Move rule up"
        use:chevronUpIcon
      ></button>
      <button
        class="clickable-icon extra-setting-button"
        onclick={() => {}}
        aria-label="Move rule down"
        use:chevronDownIcon
      ></button>
    </div>
  </div>
  <div class="setting-item-info">
    <div class="setting-item-name">{rule.name || "Unnamed"}</div>
  </div>
  <div class="setting-item-control">
    <div class="checkbox-container" class:is-enabled={rule.enabled}>
      <input
        type="checkbox"
        checked={rule.enabled}
        onclick={toggleEnabled}
        aria-label="Enable rule"
      />
    </div>
    <button
      class="clickable-icon extra-setting-button"
      onclick={openEditModal}
      aria-label="Edit rule"
      use:pencilIcon
    ></button>
    <button
      class="clickable-icon extra-setting-button"
      onclick={deleteRule}
      aria-label="Delete rule"
      use:trashIcon
    ></button>
  </div>
</div>

<style>
  .ordering-controls {
    flex-grow: 0;
  }
</style>
