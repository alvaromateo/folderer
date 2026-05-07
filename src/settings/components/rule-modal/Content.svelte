<script lang="ts">
  import { Notice } from "obsidian";
  import { untrack } from "svelte";
  import { plusIcon, trashIcon } from "../icons";
  import type FoldererPlugin from "../../../main";
  import type { MonitoredFolder } from "../../folder-settings";
  import type {
    ActionData,
    ConditionData,
    RootConditionData,
    RuleData,
    Trigger,
    TriggerType,
  } from "../../../types";
  import Conditions from "./Conditions.svelte";

  interface Props {
    plugin: FoldererPlugin;
    folder: MonitoredFolder;
    selectedRule: RuleData | null;
    onClose: () => void;
  }

  let { plugin, folder, selectedRule, onClose }: Props = $props();

  const isNew = untrack(() => selectedRule === null);

  function deepCopyCondition(
    condition: ConditionData
  ): ConditionData {
    return {
      ...condition,
    };
  }

  function deepCopyRule(r: RuleData): RuleData {
    const copiedConditions = r.conditions?.conditions?.map(
      (cond) => deepCopyCondition(cond)
    ) ?? [];
    return {
      ...r,
      trigger: { ...r.trigger },
      conditions: r.conditions
        ? { ...r.conditions, conditions: copiedConditions }
        : undefined,
      actions: r.actions?.map((a) => ({ ...a, params: { ...a.params } })),
    };
  }

  let rule = $state<RuleData>(
    untrack(() =>
      isNew
        ? {
            id: crypto.randomUUID(),
            name: "",
            enabled: true,
            trigger: { type: "create" } as Trigger,
            conditions: undefined,
            actions: [
              {
                type:
                  plugin.engine.registry.allActions()[0]?.type ?? "append-text",
                params: {},
              },
            ],
          }
        : deepCopyRule(selectedRule!),
    ),
  );

  let firstAction = $derived<ActionData>(
    rule.actions?.[0] ?? { type: "append-text", params: {} },
  );

  let actionFields = $derived(
    plugin.engine.registry.getAction(firstAction.type)?.fields ?? [],
  );

  function onTriggerChange(e: Event) {
    rule.trigger.type = (e.target as HTMLSelectElement).value as TriggerType;
  }

  function onRootConditionChange(e: Event) {
    if (rule.conditions) {
      const target = e.target as HTMLSelectElement;
      rule.conditions.type = target.value as RootConditionData["type"];
    }
  }

  function onActionTypeChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    if (!rule.actions) rule.actions = [];
    rule.actions[0] = { type: v, params: {} };
  }

  async function save() {
    if (!rule.name.trim()) {
      new Notice("Rule name cannot be empty.");
      return;
    }

    const actionHandler = plugin.engine.registry.getAction(firstAction.type);
    for (const field of actionHandler?.fields ?? []) {
      if (!(firstAction.params[field.key] ?? "").trim()) {
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

  function addConditions() {
    // default selected "all" conditions (as it is the most common)
    rule.conditions = {
      type: "all",
      conditions: [],
    };
  }

  function removeConditions() {
    rule.conditions = undefined;
  }
</script>

<section class="rule-modal">

  <!-- Rule name and activation -->
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

  <!-- Type of trigger for the rule -->
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

  <!-- Conditions -->
  <div class="setting-item multiple-entries">
    <div class="rule-row heading">
      <div class="setting-item-info">
        <div class="setting-item-name">Conditions</div>
      </div>
      <div class="setting-item-control">
        {#if rule.conditions === undefined}
          <button
            class="clickable-icon extra-setting-button"
            onclick={addConditions}
            aria-label="Add conditions"
            use:plusIcon
          ></button>
        {:else}
          <button
            class="clickable-icon extra-setting-button"
            onclick={removeConditions}
            aria-label="Remove conditions"
            use:trashIcon
          ></button>
        {/if}
      </div>
    </div>

    {#if rule.conditions}
      <div class="rule-row">
        <div class="setting-item-description">
          Matching conditions
        </div>
        <select
          class="dropdown"
          value={rule.conditions.type}
          onchange={onRootConditionChange}
          aria-label="Root condition type"
        >
          <option value="all">All</option>
          <option value="any">Any</option>
          <option value="none">None</option>
        </select>
      </div>

      <Conditions
        plugin={plugin}
        conditions={rule.conditions.conditions}
      />
    {/if}
  </div>

  <!-- Actions -->
  <div class="setting-item">
    <div class="setting-item-info">
      <div class="setting-item-name">Action</div>
    </div>
    <div class="setting-item-control">
      <select
        class="dropdown"
        value={firstAction.type}
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
          value={firstAction.params[field.key] ?? ""}
          oninput={(e) => {
            if (rule.actions?.[0]) {
              rule.actions[0].params[field.key] = (
                e.target as HTMLInputElement
              ).value;
            }
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

  .multiple-entries {
    flex-direction: column;
  }

  .setting-item.multiple-entries > .heading {
    margin-inline-end: 0;
  }

  .rule-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items:center;
    width: 100%;
  }
</style>
