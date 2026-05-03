import { describe, expect, it, vi } from "vitest";
import type { ActionHandler } from "../../src/engine/action-handler";
import type { ConditionHandler } from "../../src/engine/condition-handler";
import { HandlerRegistry } from "../../src/engine/registry";
import { RuleEngine } from "../../src/engine/rule-engine";
import type { Rule } from "../../src/types";

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

function mkRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "r1",
    name: "Test rule",
    enabled: true,
    trigger: { type: "create" },
    action: { type: "append-text", params: { text: "folderer" } },
    ...overrides,
  };
}

function mkFolder(rules: Rule[]) {
  return {
    rules,
  } as unknown as import("../../src/settings/monitored-folder").MonitoredFolder;
}

function mkRegistry(
  condition?: ConditionHandler,
  action?: ActionHandler,
): HandlerRegistry {
  const registry = new HandlerRegistry();
  if (condition) registry.registerCondition(condition);
  if (action) registry.registerAction(action);
  return registry;
}

function mkAction(
  executeFn = vi.fn().mockResolvedValue(undefined),
): ActionHandler {
  return {
    type: "append-text",
    label: "Append",
    fields: [],
    execute: executeFn,
  };
}

function mkCondition(evaluateFn: () => boolean): ConditionHandler {
  return {
    type: "filename-matches",
    label: "Filename matches",
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

  it("runs the action when there is no condition", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(undefined, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const folder = mkFolder([mkRule({ condition: undefined })]);

    await engine.runRules(mkFile(), folder, "create");

    expect(execute).toHaveBeenCalledOnce();
  });

  it("skips the action when the condition returns false", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const registry = mkRegistry(
      mkCondition(() => false),
      mkAction(execute),
    );
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      condition: { type: "filename-matches", params: { pattern: "x" } },
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
      condition: { type: "filename-matches", params: { pattern: ".*" } },
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
      condition: { type: "filename-matches", params: {} },
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
      throw new Error("bad regex");
    });
    const registry = mkRegistry(throwingCondition, mkAction(execute));
    const engine = new RuleEngine(registry, mkApp());
    const rule = mkRule({
      condition: { type: "filename-matches", params: { pattern: "[" } },
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
    const makeAction = (id: string): ActionHandler => ({
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
      mkRule({ id: "r1", action: { type: "action-1", params: {} } }),
      mkRule({ id: "r2", action: { type: "action-2", params: {} } }),
    ]);

    await engine.runRules(mkFile(), folder, "create");

    expect(calls).toEqual(["1", "2"]);
  });
});
