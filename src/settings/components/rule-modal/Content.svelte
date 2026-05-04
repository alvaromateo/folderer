<script lang="ts">
  import { Notice, setIcon } from "obsidian";
  import { untrack } from "svelte";
  import ConditionRow from "./ConditionRow.svelte";
  import type FoldererPlugin from "../../../main";
  import type { MonitoredFolder } from "../../monitored-folder";
  import type {
    Action,
    ConditionData,
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

  let conditions = $state<ConditionData[]>([]);

  let actionFields = $derived(
    plugin.engine.registry.getAction(rule.action.type)?.fields ?? [],
  );

  function onTriggerChange(e: Event) {
    rule.trigger.type = (e.target as HTMLSelectElement).value as TriggerType;
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

  function plusIcon(el: HTMLElement) {
    setIcon(el, "plus");
  }

  function addConditionRow() {
    conditions.push({
      type: "none",
      conditions: [],
    });
  }

  function removeConditionRow(index: number) {
    conditions.splice(index, 1);
  }

  function addActionRow() {
    return;
  }

  function removeActionRow() {
    return;
  }
</script>

<section class="rule-modal">
  <div class="setting-item">
    <div class="setting-item-info">
      <div class="setting-item-name">Rule name</div>
    </div>
    <div class="setting-item-control rule-name-input">
      <input
        type="text"
        placeholder="My rule"
        bind:value={rule.name}
        aria-label="Rule name"
      />
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
      <div class="setting-item-name">Conditions</div>
    </div>
    <div class="setting-item-control">
      <button
        class="clickable-icon extra-setting-button"
        onclick={addConditionRow}
        aria-label="Edit rule"
        use:plusIcon
      ></button>
    </div>
  </div>

  {#if conditions.length > 0}
    <div>
      Matching conditions
    </div>
  {/if}

  <ol>
    {#each conditions as condition, i}
      <ConditionRow plugin={plugin} rule={rule} />
    {/each}
  </ol>

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
</section>

<style>
  .rule-modal {
    margin-top: 1rem;
  }

  .rule-name-input {
    flex-grow: 2;
  }

  .rule-name-input > input {
    width: 100%;
  }
</style>
