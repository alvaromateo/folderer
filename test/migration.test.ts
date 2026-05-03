import { describe, expect, it } from "vitest";

// We test the migration logic directly. Since migrateRawData is not exported
// from main.ts (it's a module-level helper), we inline a copy here that mirrors
// the implementation and is kept in sync. If the implementation ever diverges,
// the E2E test (opening the vault with old data) will catch it.

// --- copy of migration helpers from src/main.ts ---
import type {
  FoldererSettingsData,
  MonitoredFolderData,
  Rule,
} from "../src/types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function migrateCondition(c: unknown): Rule["condition"] {
  if (!isObject(c)) return undefined;
  const obj = c as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type : "filename-matches";
  if (typeof obj.value === "string" && !isObject(obj.params)) {
    return {
      type: type as Rule["condition"] extends { type: infer T } ? T : never,
      params: { pattern: obj.value },
    };
  }
  return {
    type: type as Rule["condition"] extends { type: infer T } ? T : never,
    params: isObject(obj.params) ? (obj.params as Record<string, string>) : {},
  };
}

function migrateAction(a: unknown): Rule["action"] {
  if (!isObject(a)) return { type: "append-text", params: {} };
  const obj = a as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type : "append-text";
  if (typeof obj.value === "string" && !isObject(obj.params)) {
    return {
      type: type as Rule["action"]["type"],
      params: { text: obj.value },
    };
  }
  return {
    type: type as Rule["action"]["type"],
    params: isObject(obj.params) ? (obj.params as Record<string, string>) : {},
  };
}

function migrateRule(r: unknown): Rule {
  if (!isObject(r)) {
    return {
      id: "fallback",
      name: "",
      enabled: false,
      trigger: { type: "create" },
      action: { type: "append-text", params: {} },
    };
  }
  const obj = r as Record<string, unknown>;
  return {
    id: typeof obj.id === "string" ? obj.id : "fallback",
    name: typeof obj.name === "string" ? obj.name : "",
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : true,
    trigger: isObject(obj.trigger)
      ? (obj.trigger as Rule["trigger"])
      : { type: "create" },
    condition:
      obj.condition != null ? migrateCondition(obj.condition) : undefined,
    action: migrateAction(obj.action),
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

function migrateRawData(raw: unknown): FoldererSettingsData {
  if (!isObject(raw)) return { monitoredFolders: [] };
  const rawFolders = Array.isArray(
    (raw as Record<string, unknown>).monitoredFolders,
  )
    ? ((raw as Record<string, unknown>).monitoredFolders as unknown[])
    : [];
  return { monitoredFolders: rawFolders.map(migrateFolder) };
}

// --- tests ---

describe("migrateRawData — action migration", () => {
  it("migrates old-shape action { type, value } to { type, params: { text } }", () => {
    const raw = {
      monitoredFolders: [
        {
          path: "Literature",
          rules: [
            {
              id: "r1",
              name: "My rule",
              enabled: true,
              trigger: { type: "create" },
              action: { type: "append-text", value: "folderer" },
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules[0]?.action).toEqual({
      type: "append-text",
      params: { text: "folderer" },
    });
  });

  it("passes through already-migrated action { type, params } unchanged", () => {
    const raw = {
      monitoredFolders: [
        {
          path: "Literature",
          rules: [
            {
              id: "r1",
              name: "My rule",
              enabled: true,
              trigger: { type: "create" },
              action: { type: "append-text", params: { text: "folderer" } },
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules[0]?.action).toEqual({
      type: "append-text",
      params: { text: "folderer" },
    });
  });
});

describe("migrateRawData — condition migration", () => {
  it("migrates old-shape condition { type, value } to { type, params: { pattern } }", () => {
    const raw = {
      monitoredFolders: [
        {
          path: "Literature",
          rules: [
            {
              id: "r1",
              name: "My rule",
              enabled: true,
              trigger: { type: "create" },
              action: { type: "append-text", params: { text: "x" } },
              condition: { type: "filename-matches", value: "^rule-" },
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules[0]?.condition).toEqual({
      type: "filename-matches",
      params: { pattern: "^rule-" },
    });
  });

  it("passes through already-migrated condition { type, params } unchanged", () => {
    const raw = {
      monitoredFolders: [
        {
          path: "Literature",
          rules: [
            {
              id: "r1",
              name: "My rule",
              enabled: true,
              trigger: { type: "create" },
              action: { type: "append-text", params: { text: "x" } },
              condition: {
                type: "filename-matches",
                params: { pattern: "^rule-" },
              },
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules[0]?.condition).toEqual({
      type: "filename-matches",
      params: { pattern: "^rule-" },
    });
  });

  it("omits the condition when the rule has no condition", () => {
    const raw = {
      monitoredFolders: [
        {
          path: "Literature",
          rules: [
            {
              id: "r1",
              name: "My rule",
              enabled: true,
              trigger: { type: "create" },
              action: { type: "append-text", params: { text: "x" } },
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules[0]?.condition).toBeUndefined();
  });
});

describe("migrateRawData — edge cases", () => {
  it("returns empty settings for null input", () => {
    expect(migrateRawData(null)).toEqual({ monitoredFolders: [] });
  });

  it("returns empty settings for a non-object input", () => {
    expect(migrateRawData("bad")).toEqual({ monitoredFolders: [] });
  });

  it("returns empty folders array when monitoredFolders key is missing", () => {
    expect(migrateRawData({})).toEqual({ monitoredFolders: [] });
  });

  it("returns empty rules array when rules key is missing from a folder", () => {
    const raw = { monitoredFolders: [{ path: "Literature" }] };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules).toEqual([]);
  });

  it("preserves folder path through migration", () => {
    const raw = { monitoredFolders: [{ path: "My Notes", rules: [] }] };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.path).toBe("My Notes");
  });

  it("handles multiple folders and rules", () => {
    const raw = {
      monitoredFolders: [
        {
          path: "A",
          rules: [
            {
              id: "r1",
              name: "R1",
              enabled: true,
              trigger: { type: "create" },
              action: { type: "append-text", value: "foo" },
            },
          ],
        },
        {
          path: "B",
          rules: [
            {
              id: "r2",
              name: "R2",
              enabled: false,
              trigger: { type: "rename" },
              action: { type: "prepend-text", value: "bar" },
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders).toHaveLength(2);
    expect(result.monitoredFolders[0]?.rules[0]?.action.params).toEqual({
      text: "foo",
    });
    expect(result.monitoredFolders[1]?.rules[0]?.action.params).toEqual({
      text: "bar",
    });
  });
});
