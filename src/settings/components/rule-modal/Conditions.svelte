<script lang="ts">
  import type FoldererPlugin from "../../../main";
  import type { ConditionData } from "../../../types";
  import { circleSmallIcon, plusIcon, xIcon } from "../icons";

  interface Props {
    plugin: FoldererPlugin;
    conditions: ConditionData[];
  }

  let { plugin, conditions }: Props = $props();

  const allConditionHandlers = $derived(plugin.engine.registry.allConditions());

  function addCondition() {
    if (allConditionHandlers.length === 0) return;
    const firstType = allConditionHandlers[0]!;
    conditions.push({
      type: firstType.type,
      operator: firstType.operators?.[0]?.key,
      params: {},
    });
  }

  function removeCondition(index: number) {
    conditions.splice(index, 1);
  }

  function onConditionTypeChange(e: Event, index: number) {
    const value = (e.target as HTMLSelectElement).value;
    const handler = plugin.engine.registry.getCondition(value);
    conditions[index] = {
      ...conditions[index],
      type: value,
      operator: handler?.operators?.[0]?.key,
      params: {},
    };
  }

  function onOperatorChange(e: Event, index: number) {
    if (!conditions[index]) return;
    conditions[index].operator = (e.target as HTMLSelectElement).value;
  }

  function onFieldInput(e: Event, index: number, key: string) {
    if (!conditions[index]) return;
    conditions[index].params![key] = (e.target as HTMLInputElement).value;
  }

  function onValueInput(e: Event, index: number) {
    if (!conditions[index]) return;
    conditions[index].params!.value = (e.target as HTMLInputElement).value;
  }
</script>

<ol class="conditions-list">
  {#each conditions as condition, i}
    {@const handler = plugin.engine.registry.getCondition(condition.type)}
    {@const resolvedOperator = condition.operator ?? handler?.operators?.[0]?.key}
    {@const needsValueInput = handler?.operators?.find(op => op.key === resolvedOperator)?.fieldType !== "none"}
    <li class="condition-row">
      <span class="condition-bullet" use:circleSmallIcon></span>
      <div class="condition-inputs">
        <select
          class="dropdown"
          value={condition.type}
          onchange={(e) => onConditionTypeChange(e, i)}
          aria-label="Condition type"
        >
          {#each allConditionHandlers as h}
            <option value={h.type}>{h.label}</option>
          {/each}
        </select>

        {#each handler?.fields ?? [] as field (field.key)}
          <input
            type="text"
            placeholder={field.placeholder ?? field.label}
            value={condition.params?.[field.key] ?? ""}
            oninput={(e) => onFieldInput(e, i, field.key)}
            aria-label={field.label}
          />
        {/each}

        {#if handler?.operators && handler.operators.length > 0}
          <select
            class="dropdown"
            value={resolvedOperator}
            onchange={(e) => onOperatorChange(e, i)}
            aria-label="Operator"
          >
            {#each handler.operators as op}
              <option value={op.key}>{op.label}</option>
            {/each}
          </select>

          {#if needsValueInput}
            <input
              type="text"
              placeholder="value"
              value={condition.params?.value ?? ""}
              oninput={(e) => onValueInput(e, i)}
              aria-label="Condition value"
            />
          {/if}
        {/if}
      </div>

      <button
        class="clickable-icon extra-setting-button"
        onclick={() => removeCondition(i)}
        aria-label="Remove condition"
        use:xIcon
      ></button>
    </li>
  {/each}
</ol>

<button
  class="add-condition-btn"
  onclick={addCondition}
  aria-label="Add condition"
  disabled={allConditionHandlers.length === 0}
>
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
    gap: 1rem;
    width: 100%;
  }

  .condition-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .condition-bullet {
    flex-shrink: 0;
    display: flex;
    padding-top: var(--size-2-2);
    padding-bottom: var(--size-2-2);
  }

  .condition-inputs {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
    gap: 0.5rem;
  }

  .condition-inputs input[type="text"] {
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
