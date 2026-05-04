<script lang="ts">
  import type FoldererPlugin from "../../../main";
  import type { ConditionType, ConditionData } from "../../../types";

  interface Props {
    plugin: FoldererPlugin;
    condition: ConditionData;
  }

  let { plugin, condition }: Props = $props();

  let conditionFields = $derived(
    rule.conditions
      ? (plugin.engine.registry.getCondition(rule.conditions.first()?.type)?.fields ?? [])
      : [],
  );

  function onConditionTypeChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    condition.type = value;
  }
</script>

<li class="condition-row">
  <select
    class="dropdown"
    value={condition.type ?? "none"}
    onchange={onConditionTypeChange}
    aria-label="Condition type"
  >
    <option value="none">None</option>
    {#each plugin.engine.registry.allConditions() as handler}
      <option value={handler.type}>{handler.label}</option>
    {/each}
  </select>

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
</li>
