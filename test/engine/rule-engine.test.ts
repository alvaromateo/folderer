import { describe, expect, it, vi } from "vitest";
import type { ActionExecutor } from "../../src/engine/actions/executor";
import type { ConditionEvaluator } from "../../src/engine/conditions/evaluator";
import { HandlerRegistry } from "../../src/engine/registry";
import { RuleEngine } from "../../src/engine/rule-engine";
import type { RuleData } from "../../src/types";

// Polyfill Obsidian Array extensions
// biome-ignore lint/suspicious/noExplicitAny: polyfill
(Array.prototype as any).first = function () {
  return this[0];
};
// biome-ignore lint/suspicious/noExplicitAny: polyfill
(Array.prototype as any).remove = function <T>(item: T) {
  const i = this.indexOf(item);
  if (i > -1) this.splice(i, 1);
  return this;
};

function mkFile(name = "note.md", path = "Folder/note.md") {
  return { name, path } as unknown as import("obsidian").TFile;
}

function mkApp() {
  return {} as unknown as import("obsidian").App;
}

function mkRule(overrides: Partial<RuleData> = {}): RuleData {
  return {
    id: "r1",
    name: "Test rule",
    enabled: true,
    trigger: { type: "create" },
    actions: [{ type: "append-text", params: { text: "folderer" } }],
    ...overrides,
  };
}

function mkFolder(rules: RuleData[]) {
  return {
    rules,
  } as unknown as import("../../src/settings/folder-settings").MonitoredFolder;
}

function mkRegistry(
  condition?: ConditionEvaluator,
  action?: ActionExecutor,
): HandlerRegistry {
  const registry = new HandlerRegistry();
  if (condition) registry.registerCondition(condition);
  if (action) registry.registerAction(action);
  return registry;
}

function mkAction(
  executeFn = vi.fn().mockResolvedValue(undefined),
): ActionExecutor {
  return {
    type: "append-text",
    label: "Append",
    fields: [],
    execute: executeFn,
  };
}

function mkCondition(evaluateFn: () => boolean): ConditionEvaluator {
  return {
    type: "file-name",
    label: "File name",
    fields: [],
    evaluate: evaluateFn,
  };
}

describe("RuleEngine.runRules", () => {
  it("executes the action when a rule is enabled and trigger matches", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(undefined, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule()]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("skips a disabled rule", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(undefined, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule({ enabled: false })]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).not.toHaveBeenCalled();
  });

  it("skips a rule whose trigger type does not match", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(undefined, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule({ trigger: { type: "rename" } })]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).not.toHaveBeenCalled();
  });

  it("runs the action when there are no conditions", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(undefined, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule({ conditions: [] })]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("skips the action when a condition returns false", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(
      mkCondition(() => false),
      mkAction(execute),
    );
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [
        { type: "file-name", operator: "matches", params: { value: "x" } },
      ],
    });
    const folder = mkFolder([rule]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).not.toHaveBeenCalled();
  });

  it("runs the action when the condition returns true", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(
      mkCondition(() => true),
      mkAction(execute),
    );
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [
        { type: "file-name", operator: "matches", params: { value: ".*" } },
      ],
    });
    const folder = mkFolder([rule]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("warns and skips when the condition type is unregistered", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const execute = vi.fn();
    const registry = mkRegistry(undefined, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [{ type: "file-name", params: {} }],
    });
    const folder = mkFolder([rule]);

    await engine.runRules(mkFile(), folder, "create");

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("unknown condition type");
    expect(execute).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns and skips when the action type is unregistered", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = new HandlerRegistry();
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule()]);

    await engine.runRules(mkFile(), folder, "create");

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("unknown action type");
    warn.mockRestore();
  });

  it("warns and skips when a condition evaluation throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const execute = vi.fn();
    const throwingCondition = mkCondition(() => {
      throw new Error("bad eval");
    });
    const registry = mkRegistry(throwingCondition, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [{ type: "file-name", params: {} }],
    });
    const folder = mkFolder([rule]);

    await engine.runRules(mkFile(), folder, "create");

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("condition evaluation failed");
    expect(execute).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("logs an error but does not throw when an action throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingAction = mkAction(
      vi.fn().mockRejectedValue(new Error("write fail")),
    );
    const registry = mkRegistry(undefined, failingAction);
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule()]);

    await expect(
      engine.runRules(mkFile(), folder, "create"),
    ).resolves.not.toThrow();
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });

  it("processes multiple rules in sequence", async () => {
    const calls: string[] = [];
    const makeAction = (id: string): ActionExecutor => ({
      type: `action-${id}`,
      label: id,
      fields: [],
      execute: vi.fn(async () => {
        calls.push(id);
      }),
    });
    const registry = new HandlerRegistry();
    const a1 = makeAction("1");
    const a2 = makeAction("2");
    registry.registerAction(a1);
    registry.registerAction(a2);
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([
      mkRule({ id: "r1", actions: [{ type: "action-1", params: {} }] }),
      mkRule({ id: "r2", actions: [{ type: "action-2", params: {} }] }),
    ]);

    await engine.runRules(mkFile(), folder, "create");

    expect(calls).toEqual(["1", "2"]);
  });

  it("evaluates all conditions with AND semantics (all must pass)", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const passingCondition = mkCondition(() => true);
    const failingCondition: ConditionEvaluator = {
      type: "file-path",
      label: "File path",
      fields: [],
      evaluate: () => false,
    };
    const registry = new HandlerRegistry();
    registry.registerCondition(passingCondition);
    registry.registerCondition(failingCondition);
    registry.registerAction(mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [
        { type: "file-name", params: {} },
        { type: "file-path", params: {} },
      ],
    });

    await engine.runRules(mkFile(), mkFolder([rule]), "create");

    expect(execute).not.toHaveBeenCalled();
  });

  it("handles composite 'all' condition — passes when all children pass", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const evaluator = mkCondition(() => true);
    const registry = mkRegistry(evaluator, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [
        {
          type: "all",
          conditions: [
            { type: "file-name", params: {} },
            { type: "file-name", params: {} },
          ],
        },
      ],
    });

    await engine.runRules(mkFile(), mkFolder([rule]), "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("handles composite 'any' condition — passes when at least one child passes", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const passingEvaluator = mkCondition(() => true);
    const failingEvaluator: ConditionEvaluator = {
      type: "file-path",
      label: "File path",
      fields: [],
      evaluate: () => false,
    };
    const registry = new HandlerRegistry();
    registry.registerCondition(passingEvaluator);
    registry.registerCondition(failingEvaluator);
    registry.registerAction(mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [
        {
          type: "any",
          conditions: [
            { type: "file-name", params: {} },
            { type: "file-path", params: {} },
          ],
        },
      ],
    });

    await engine.runRules(mkFile(), mkFolder([rule]), "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("handles composite 'none' condition — passes when no children pass", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const failingEvaluator = mkCondition(() => false);
    const registry = mkRegistry(failingEvaluator, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      conditions: [
        {
          type: "none",
          conditions: [{ type: "file-name", params: {} }],
        },
      ],
    });

    await engine.runRules(mkFile(), mkFolder([rule]), "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("executes multiple actions in sequence", async () => {
    const calls: string[] = [];
    const action1: ActionExecutor = {
      type: "action-1",
      label: "1",
      fields: [],
      execute: vi.fn(async () => {
        calls.push("1");
      }),
    };
    const action2: ActionExecutor = {
      type: "action-2",
      label: "2",
      fields: [],
      execute: vi.fn(async () => {
        calls.push("2");
      }),
    };
    const registry = new HandlerRegistry();
    registry.registerAction(action1);
    registry.registerAction(action2);
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      actions: [
        { type: "action-1", params: {} },
        { type: "action-2", params: {} },
      ],
    });

    await engine.runRules(mkFile(), mkFolder([rule]), "create");

    expect(calls).toEqual(["1", "2"]);
  });
});
