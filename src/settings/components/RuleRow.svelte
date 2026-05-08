<script lang="ts">
  import type FoldererPlugin from "../../main";
  import type { MonitoredFolder } from "../folder-settings";
  import type { RuleData } from "../../types";
  import { RuleModal } from "../rule-modal";
  import { chevronDownIcon, chevronUpIcon, pencilIcon, trashIcon } from "./icons";

  interface Props {
    plugin: FoldererPlugin;
    folder: MonitoredFolder;
    rule: RuleData;
    index: number;
    totalRules: number;
  }

  let { plugin, folder, rule, index, totalRules }: Props = $props();

  async function moveUp() {
    if (folder.moveRule(rule.id, "up")) {
      await plugin.saveSettings();
    }
  }

  async function moveDown() {
    if (folder.moveRule(rule.id, "down")) {
      await plugin.saveSettings();
    }
  }

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
</script>

<div class="setting-item">
  <div class="rule-name">
    <div class="setting-item-control ordering-controls">
      <button
        class="clickable-icon extra-setting-button"
        onclick={moveUp}
        disabled={index === 0}
        aria-label="Move rule up"
        use:chevronUpIcon
      ></button>
      <button
        class="clickable-icon extra-setting-button"
        onclick={moveDown}
        disabled={index === totalRules - 1}
        aria-label="Move rule down"
        use:chevronDownIcon
      ></button>
    </div>
    <div class="setting-item-info">
      <div class="setting-item-name">{rule.name || "Unnamed"}</div>
    </div>
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

  .rule-name {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .rule-name > *:first-child {
    margin-inline-end: var(--size-4-4);
  }

  @container (max-width: 340px) {
    .setting-item .rule-name > .setting-item-control {
      width: auto;
    }

    .setting-item .rule-name > .setting-item-info {
      align-self: auto;
    }
  }
</style>
