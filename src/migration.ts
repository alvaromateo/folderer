import { CONDITION_FILE_NAME } from "./constants";
import type {
  ActionData,
  ConditionData,
  FoldererSettingsData,
  MonitoredFolderData,
  RootConditionData,
  RuleData,
  TriggerType,
} from "./types";

export function migrateRawData(raw: unknown): FoldererSettingsData {
  if (!isObject(raw)) return { monitoredFolders: [] };
  const rawFolders = Array.isArray(
    (raw as Record<string, unknown>).monitoredFolders,
  )
    ? ((raw as Record<string, unknown>).monitoredFolders as unknown[])
    : [];
  return {
    monitoredFolders: rawFolders.map(migrateFolder),
  };
}

function migrateFolder(f: unknown): MonitoredFolderData {
  if (!isObject(f)) return { path: "", rules: [] };
  const obj = f as Record<string, unknown>;
  return {
    path: typeof obj.path === "string" ? obj.path : "",
    rules: Array.isArray(obj.rules) ? obj.rules.map(migrateRule) : [],
  };
}

function wrapConditions(list: ConditionData[]): RootConditionData | undefined {
  return list.length > 0 ? { type: "all", conditions: list } : undefined;
}

function migrateRule(r: unknown): RuleData {
  if (!isObject(r)) {
    return {
      id: crypto.randomUUID(),
      name: "",
      enabled: false,
      trigger: { type: "create" },
      actions: [{ type: "append-text", params: {} }],
    };
  }
  const obj = r as Record<string, unknown>;

  const base = {
    id: typeof obj.id === "string" ? obj.id : crypto.randomUUID(),
    name: typeof obj.name === "string" ? obj.name : "",
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : true,
    trigger:
      isObject(obj.trigger) &&
      typeof (obj.trigger as Record<string, unknown>).type === "string"
        ? { type: (obj.trigger as Record<string, unknown>).type as TriggerType }
        : { type: "create" as const },
  };

  // Current format: conditions is already a RootConditionData object
  if (isObject(obj.conditions)) {
    const root = obj.conditions as Record<string, unknown>;
    const rawType = root.type;
    const type: "all" | "any" | "none" =
      rawType === "any" ? "any" : rawType === "none" ? "none" : "all";
    const inner = Array.isArray(root.conditions)
      ? (root.conditions as unknown[])
          .map(migrateConditionData)
          .filter((c): c is ConditionData => c !== undefined)
      : [];
    return {
      ...base,
      conditions: { type, conditions: inner },
      actions: Array.isArray(obj.actions)
        ? (obj.actions as unknown[]).map(migrateActionData)
        : [],
    };
  }

  // Intermediate format: conditions was a flat ConditionData[]
  if (Array.isArray(obj.conditions) || Array.isArray(obj.actions)) {
    const condList = Array.isArray(obj.conditions)
      ? (obj.conditions as unknown[])
          .map(migrateConditionData)
          .filter((c): c is ConditionData => c !== undefined)
      : [];
    return {
      ...base,
      conditions: wrapConditions(condList),
      actions: Array.isArray(obj.actions)
        ? (obj.actions as unknown[]).map(migrateActionData)
        : [],
    };
  }

  // Old format: single condition? + single action
  const condList: ConditionData[] = [];
  if (obj.condition != null) {
    const cond = migrateConditionData(obj.condition);
    if (cond) condList.push(cond);
  }

  return {
    ...base,
    conditions: wrapConditions(condList),
    actions: [migrateActionData(obj.action)],
  };
}

function migrateConditionData(c: unknown): ConditionData | undefined {
  if (!isObject(c)) return undefined;
  const obj = c as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type : "filename-matches";

  // Migrate old "filename-matches" → new "file-name" with operator "matches"
  if (type === "filename-matches") {
    const pattern =
      typeof obj.value === "string"
        ? obj.value
        : isObject(obj.params)
          ? ((obj.params as Record<string, string>).pattern ?? "")
          : "";
    return {
      type: CONDITION_FILE_NAME,
      operator: "matches",
      params: { value: pattern },
    };
  }

  return {
    type,
    operator: typeof obj.operator === "string" ? obj.operator : undefined,
    params: isObject(obj.params)
      ? (obj.params as Record<string, string>)
      : undefined,
    conditions: Array.isArray(obj.conditions)
      ? (obj.conditions as unknown[])
          .map(migrateConditionData)
          .filter((c): c is ConditionData => c !== undefined)
      : undefined,
  };
}

function migrateActionData(a: unknown): ActionData {
  if (!isObject(a)) return { type: "append-text", params: {} };
  const obj = a as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type : "append-text";
  // migrate old { type, value } shape → { type, params: { text: value } }
  if (typeof obj.value === "string" && !isObject(obj.params)) {
    return { type, params: { text: obj.value } };
  }
  return {
    type,
    params: isObject(obj.params) ? (obj.params as Record<string, string>) : {},
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
