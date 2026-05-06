<script lang="ts">
  import { setIcon } from "obsidian";
  import type FoldererPlugin from "../../../main";
  import type { ConditionData } from "../../../types";

  interface Props {
    plugin: FoldererPlugin;
    conditions: ConditionData[];
  }

  let { plugin, conditions }: Props = $props();

  function addCondition() {
    const firstType = plugin.engine.registry.allConditions()[0];
    conditions.push({
      type: firstType?.type ?? "",
      operator: firstType?.operators?.[0]?.key,
      params: {},
    });
  }

  function removeCondition(index: number) {
    conditions.splice(index, 1);
  }

  function onConditionTypeChange(e: Event, index: number) {
    const value = (e.target as HTMLSelectElement).value;
    const handler = plugin.engine.registry.getCondition(value);
    conditions[index].type = value;
    conditions[index].params = {};
    conditions[index].operator = handler?.operators?.[0]?.key;
  }

  function onOperatorChange(e: Event, index: number) {
    conditions[index].operator = (e.target as HTMLSelectElement).value;
  }

  function xIcon(el: HTMLElement) {
    setIcon(el, "x");
  }

  function plusIcon(el: HTMLElement) {
    setIcon(el, "plus");
  }
</script>

<ol class="conditions-list">
  {#each conditions as condition, i}
    {@const handler = plugin.engine.registry.getCondition(condition.type)}
    {@const activeOperator = condition.operator ?? handler?.operators?.[0]?.key}
    <li class="condition-row">
      <select
        class="dropdown"
        value={condition.type}
        onchange={(e) => onConditionTypeChange(e, i)}
        aria-label="Condition type"
      >
        {#each plugin.engine.registry.allConditions() as h}
          <option value={h.type}>{h.label}</option>
        {/each}
      </select>

      {#each handler?.fields ?? [] as field (field.key)}
        <input
          type="text"
          placeholder={field.placeholder ?? field.label}
          value={condition.params?.[field.key] ?? ""}
          oninput={(e) => {
            if (!condition.params) condition.params = {};
            condition.params[field.key] = (e.target as HTMLInputElement).value;
          }}
          aria-label={field.label}
        />
      {/each}

      {#if handler?.operators && handler.operators.length > 0}
        <select
          class="dropdown"
          value={activeOperator}
          onchange={(e) => onOperatorChange(e, i)}
          aria-label="Operator"
        >
          {#each handler.operators as op}
            <option value={op.key}>{op.label}</option>
          {/each}
        </select>

        {#if activeOperator !== "exists"}
          <input
            type="text"
            placeholder="value"
            value={condition.params?.value ?? ""}
            oninput={(e) => {
              if (!condition.params) condition.params = {};
              condition.params.value = (e.target as HTMLInputElement).value;
            }}
            aria-label="Condition value"
          />
        {/if}
      {/if}

      <button
        class="clickable-icon extra-setting-button"
        onclick={() => removeCondition(i)}
        aria-label="Remove condition"
        use:xIcon
      ></button>
    </li>
  {/each}
</ol>

<button class="add-condition-btn" onclick={addCondition} aria-label="Add condition">
  <span use:plusIcon></span>
  Add condition
</button>

<style>
  .conditions-list {
    list-style: none;
    padding: 0;
    margin: 0 0 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .condition-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .condition-row input[type="text"] {
    flex: 1;
    min-width: 8rem;
  }

  .add-condition-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
  }
</style>
