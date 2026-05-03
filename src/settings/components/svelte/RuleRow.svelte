<script lang="ts">
  import { setIcon } from "obsidian";
  import type FoldererPlugin from "../../../main";
  import type { MonitoredFolder } from "../../monitored-folder";
  import type { Rule } from "../../../types";
  import { RuleModal } from "../rules/rule-modal";

  interface Props {
    plugin: FoldererPlugin;
    folder: MonitoredFolder;
    rule: Rule;
  }

  let { plugin, folder, rule }: Props = $props();

  function buildDescription(): string {
    const parts: string[] = [`on ${rule.trigger.type}`];
    if (rule.condition) {
      const condHandler = plugin.engine.registry.getCondition(
        rule.condition.type,
      );
      parts.push(`if ${condHandler?.label ?? rule.condition.type}`);
    }
    const actHandler = plugin.engine.registry.getAction(rule.action.type);
    parts.push(`→ ${actHandler?.label ?? rule.action.type}`);
    return parts.join(" ");
  }

  let description = $derived(buildDescription());

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
</script>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">{rule.name || "Unnamed"}</div>
    <div class="setting-item-description">{description}</div>
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
