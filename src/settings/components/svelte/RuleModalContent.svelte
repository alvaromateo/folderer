<script lang="ts">
  import { Notice } from "obsidian";
  import { untrack } from "svelte";
  import type FoldererPlugin from "../../../main";
  import type { MonitoredFolder } from "../../monitored-folder";
  import type {
    Action,
    ConditionType,
    Rule,
    Trigger,
    TriggerType,
  } from "../../../types";

  interface Props {
    plugin: FoldererPlugin;
    folder: MonitoredFolder;
    selectedRule: Rule | null;
    onClose: () => void;
  }

  let { plugin, folder, selectedRule, onClose }: Props = $props();

  const isNew = untrack(() => selectedRule === null);

  function deepCopyRule(r: Rule): Rule {
    return {
      ...r,
      trigger: { ...r.trigger },
      condition: r.condition
        ? { ...r.condition, params: { ...r.condition.params } }
        : undefined,
      action: { ...r.action, params: { ...r.action.params } },
    };
  }

  let rule = $state<Rule>(
    untrack(() =>
      isNew
        ? {
            id: crypto.randomUUID(),
            name: "",
            enabled: true,
            trigger: { type: "create" } as Trigger,
            action: {
              type: (plugin.engine.registry.allActions()[0]?.type ??
                "append-text") as Action["type"],
              params: {},
            },
          }
        : deepCopyRule(selectedRule!),
    ),
  );

  let conditionFields = $derived(
    rule.condition
      ? (plugin.engine.registry.getCondition(rule.condition.type)?.fields ?? [])
      : [],
  );

  let actionFields = $derived(
    plugin.engine.registry.getAction(rule.action.type)?.fields ?? [],
  );

  function onTriggerChange(e: Event) {
    rule.trigger.type = (e.target as HTMLSelectElement).value as TriggerType;
  }

  function onConditionTypeChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    if (v === "none") {
      rule.condition = undefined;
    } else {
      rule.condition = {
        type: v as ConditionType,
        params: rule.condition?.params ?? {},
      };
    }
  }

  function onActionTypeChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    rule.action = { type: v as Action["type"], params: {} };
  }

  async function save() {
    if (!rule.name.trim()) {
      new Notice("Rule name cannot be empty.");
      return;
    }

    const actionHandler = plugin.engine.registry.getAction(rule.action.type);
    for (const field of actionHandler?.fields ?? []) {
      if (!(rule.action.params[field.key] ?? "").trim()) {
        new Notice(`${field.label} cannot be empty.`);
        return;
      }
    }

    if (isNew) {
      folder.addRule($state.snapshot(rule));
    } else {
      folder.modifyRule($state.snapshot(rule));
    }
    await plugin.saveSettings();
    onClose();
  }
</script>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Rule name</div>
  </div>
  <div class="setting-item-control">
    <input
      type="text"
      placeholder="My rule"
      bind:value={rule.name}
      aria-label="Rule name"
    />
  </div>
</div>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Enabled</div>
  </div>
  <div class="setting-item-control">
    <div class="checkbox-container" class:is-enabled={rule.enabled}>
      <input
        type="checkbox"
        bind:checked={rule.enabled}
        aria-label="Enabled"
      />
    </div>
  </div>
</div>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Trigger</div>
    <div class="setting-item-description">Which vault event fires this rule</div>
  </div>
  <div class="setting-item-control">
    <select
      class="dropdown"
      value={rule.trigger.type}
      onchange={onTriggerChange}
      aria-label="Trigger event"
    >
      <option value="create">File created</option>
      <option value="rename">File renamed / moved</option>
      <option value="delete">File deleted</option>
    </select>
  </div>
</div>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Condition</div>
    <div class="setting-item-description">
      Optional filter — leave as None to always run the action
    </div>
  </div>
  <div class="setting-item-control">
    <select
      class="dropdown"
      value={rule.condition?.type ?? "none"}
      onchange={onConditionTypeChange}
      aria-label="Condition type"
    >
      <option value="none">None</option>
      {#each plugin.engine.registry.allConditions() as handler}
        <option value={handler.type}>{handler.label}</option>
      {/each}
    </select>
  </div>
</div>

{#each conditionFields as field (field.key)}
  <div class="setting-item">
    <div class="setting-item-info">
      <div class="setting-item-name">{field.label}</div>
      {#if field.description}
        <div class="setting-item-description">{field.description}</div>
      {/if}
    </div>
    <div class="setting-item-control">
      <input
        type="text"
        placeholder={field.placeholder ?? ""}
        value={rule.condition?.params[field.key] ?? ""}
        oninput={(e) => {
          if (rule.condition)
            rule.condition.params[field.key] = (
              e.target as HTMLInputElement
            ).value;
        }}
        aria-label={field.label}
      />
    </div>
  </div>
{/each}

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Action</div>
  </div>
  <div class="setting-item-control">
    <select
      class="dropdown"
      value={rule.action.type}
      onchange={onActionTypeChange}
      aria-label="Action type"
    >
      {#each plugin.engine.registry.allActions() as handler}
        <option value={handler.type}>{handler.label}</option>
      {/each}
    </select>
  </div>
</div>

{#each actionFields as field (field.key)}
  <div class="setting-item">
    <div class="setting-item-info">
      <div class="setting-item-name">{field.label}</div>
      {#if field.description}
        <div class="setting-item-description">{field.description}</div>
      {/if}
    </div>
    <div class="setting-item-control">
      <input
        type="text"
        placeholder={field.placeholder ?? ""}
        value={rule.action.params[field.key] ?? ""}
        oninput={(e) => {
          rule.action.params[field.key] = (e.target as HTMLInputElement).value;
        }}
        aria-label={field.label}
      />
    </div>
  </div>
{/each}

<div class="setting-item">
  <div class="setting-item-info"></div>
  <div class="setting-item-control">
    <button class="mod-cta" onclick={save}>{isNew ? "Add" : "Save"}</button>
    <button onclick={onClose}>Cancel</button>
  </div>
</div>
