import { describe, expect, it } from "vitest";

import { migrateRawData } from "../src/migration";

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
    expect(result.monitoredFolders[0]?.rules[0]?.actions?.[0]).toEqual({
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
    expect(result.monitoredFolders[0]?.rules[0]?.actions?.[0]).toEqual({
      type: "append-text",
      params: { text: "folderer" },
    });
  });
});

describe("migrateRawData — condition migration", () => {
  it("migrates old 'filename-matches' { type, value } to 'file-name' with operator 'matches'", () => {
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
    expect(
      result.monitoredFolders[0]?.rules[0]?.conditions?.conditions[0],
    ).toEqual({
      type: "file-name",
      operator: "matches",
      params: { value: "^rule-" },
    });
  });

  it("migrates old 'filename-matches' { type, params: { pattern } } to 'file-name'", () => {
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
    expect(
      result.monitoredFolders[0]?.rules[0]?.conditions?.conditions[0],
    ).toEqual({
      type: "file-name",
      operator: "matches",
      params: { value: "^rule-" },
    });
  });

  it("omits conditions when the rule has no condition", () => {
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
    expect(result.monitoredFolders[0]?.rules[0]?.conditions).toBeUndefined();
  });

  it("passes through already-new-format rule with conditions[] and actions[]", () => {
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
              conditions: [
                {
                  type: "file-name",
                  operator: "contains",
                  params: { value: "meeting" },
                },
              ],
              actions: [{ type: "append-text", params: { text: "x" } }],
            },
          ],
        },
      ],
    };
    const result = migrateRawData(raw);
    expect(result.monitoredFolders[0]?.rules[0]?.conditions).toEqual({
      type: "all",
      conditions: [
        {
          type: "file-name",
          operator: "contains",
          params: { value: "meeting" },
        },
      ],
    });
    expect(result.monitoredFolders[0]?.rules[0]?.actions?.[0]).toEqual({
      type: "append-text",
      params: { text: "x" },
    });
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
    expect(result.monitoredFolders[0]?.rules[0]?.actions?.[0]?.params).toEqual({
      text: "foo",
    });
    expect(result.monitoredFolders[1]?.rules[0]?.actions?.[0]?.params).toEqual({
      text: "bar",
    });
  });
});
