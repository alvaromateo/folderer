<script lang="ts">
  import type FoldererPlugin from "../../../main";
  import type { ActionData } from "../../../types";
  import { circleSmallIcon, plusIcon, xIcon } from "../icons";

  interface Props {
    plugin: FoldererPlugin;
    actions: ActionData[];
  }

  let { plugin, actions }: Props = $props();

  const allActionHandlers = $derived(plugin.engine.registry.allActions());

  function addAction() {
    if (allActionHandlers.length === 0) return;
    const firstType = allActionHandlers[0]!;
    actions.push({ type: firstType.type, params: {} });
  }

  function removeAction(index: number) {
    actions.splice(index, 1);
  }

  function onActionTypeChange(e: Event, index: number) {
    const value = (e.target as HTMLSelectElement).value;
    // Reset params — new type has a different field schema
    actions[index] = { type: value, params: {} };
  }

  function onFieldInput(e: Event, index: number, key: string) {
    if (!actions[index]) return;
    actions[index].params[key] = (e.target as HTMLInputElement).value;
  }
</script>

<ol class="actions-list">
  {#each actions as action, i}
    {@const handler = plugin.engine.registry.getAction(action.type)}
    <li class="action-row">
      <span class="action-bullet" use:circleSmallIcon></span>
      <div class="action-inputs">
        <select
          class="dropdown"
          value={action.type}
          onchange={(e) => onActionTypeChange(e, i)}
          aria-label="Action type"
        >
          {#each allActionHandlers as h}
            <option value={h.type}>{h.label}</option>
          {/each}
        </select>

        {#each handler?.fields ?? [] as field (field.key)}
          <input
            type="text"
            placeholder={field.placeholder ?? field.label}
            value={action.params[field.key] ?? ""}
            oninput={(e) => onFieldInput(e, i, field.key)}
            aria-label={field.label}
          />
        {/each}
      </div>

      <!-- At least one action is required; disable removal when only one remains -->
      <button
        class="clickable-icon extra-setting-button"
        onclick={() => removeAction(i)}
        aria-label="Remove action"
        title={actions.length <= 1 ? "At least one action is required" : undefined}
        disabled={actions.length <= 1}
        use:xIcon
      ></button>
    </li>
  {/each}
</ol>

<button
  class="add-action-btn"
  onclick={addAction}
  aria-label="Add action"
  disabled={allActionHandlers.length === 0}
>
  <span use:plusIcon></span>
  Add action
</button>

<style>
  .actions-list {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--size-4-2);
    display: flex;
    flex-direction: column;
    gap: var(--size-4-4);
    width: 100%;
  }

  .action-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--size-4-2);
  }

  .action-bullet {
    flex-shrink: 0;
    display: flex;
    padding-top: var(--size-2-2);
    padding-bottom: var(--size-2-2);
  }

  .action-inputs {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
    gap: var(--size-4-2);
  }

  .action-inputs input[type="text"] {
    flex: 1;
  }

  .add-action-btn {
    display: flex;
    align-items: center;
    gap: var(--size-4-1);
    cursor: var(--cursor-link);
  }
</style>
