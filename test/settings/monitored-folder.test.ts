import { describe, expect, it, vi } from "vitest";
import { MonitoredFolder } from "../../src/settings/monitored-folder";
import type { Rule } from "../../src/types";

// Polyfill Obsidian Array extensions used by the classes under test
// biome-ignore lint/suspicious/noExplicitAny: pollyfill
(Array.prototype as any).first = function () {
  return this[0];
};
// biome-ignore lint/suspicious/noExplicitAny: pollyfill
(Array.prototype as any).remove = function <T>(item: T) {
  const i = this.indexOf(item);
  if (i > -1) this.splice(i, 1);
  return this;
};

function mkRule(id: string, name = "Rule"): Rule {
  return {
    id,
    name,
    enabled: true,
    trigger: { type: "create" },
    action: { type: "append-text", value: "folderer" },
  };
}

describe("MonitoredFolder constructor", () => {
  it("sets the path", () => {
    const folder = new MonitoredFolder("Literature");
    expect(folder.path).toBe("Literature");
  });

  it("defaults rules to an empty array when not provided", () => {
    const folder = new MonitoredFolder("Literature");
    expect(folder.rules).toEqual([]);
  });

  it("stores provided rules", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    expect(folder.rules).toEqual([rule]);
  });
});

describe("MonitoredFolder.rules getter", () => {
  it("returns the internal rules array", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    expect(folder.rules).toHaveLength(1);
    expect(folder.rules[0]).toBe(rule);
  });
});

describe("MonitoredFolder.findRule", () => {
  it("returns the rule with the matching id", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    expect(folder.findRule("r1")).toBe(rule);
  });

  it("returns undefined when no rule has that id", () => {
    const folder = new MonitoredFolder("Literature", [mkRule("r1")]);
    expect(folder.findRule("does-not-exist")).toBeUndefined();
  });

  it("returns undefined when rules list is empty", () => {
    const folder = new MonitoredFolder("Literature");
    expect(folder.findRule("r1")).toBeUndefined();
  });

  it("returns the first matching rule when duplicates exist", () => {
    const r1a = mkRule("r1", "First");
    const r1b = mkRule("r1", "Second");
    const folder = new MonitoredFolder("Literature", [r1a, r1b]);
    expect(folder.findRule("r1")).toBe(r1a);
  });
});

describe("MonitoredFolder.addRule", () => {
  it("appends the rule to the rules list", () => {
    const folder = new MonitoredFolder("Literature");
    const rule = mkRule("r1");
    folder.addRule(rule);
    expect(folder.rules).toContain(rule);
    expect(folder.rules).toHaveLength(1);
  });

  it("fires registered render callbacks with the updated rules", () => {
    const folder = new MonitoredFolder("Literature");
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    const rule = mkRule("r1");
    folder.addRule(rule);
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith([rule]);
  });

  it("fires all registered callbacks", () => {
    const folder = new MonitoredFolder("Literature");
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    folder.addRenderCallback(cb1);
    folder.addRenderCallback(cb2);
    folder.addRule(mkRule("r1"));
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("does not fire callbacks that have been removed", () => {
    const folder = new MonitoredFolder("Literature");
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    folder.removeRenderCallback(cb);
    folder.addRule(mkRule("r1"));
    expect(cb).not.toHaveBeenCalled();
  });

  it("accumulates multiple added rules", () => {
    const folder = new MonitoredFolder("Literature");
    folder.addRule(mkRule("r1"));
    folder.addRule(mkRule("r2"));
    expect(folder.rules).toHaveLength(2);
  });
});

describe("MonitoredFolder.removeRule", () => {
  it("removes the rule with the given id", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    folder.removeRule("r1");
    expect(folder.rules).toHaveLength(0);
  });

  it("fires registered render callbacks after removal", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    folder.removeRule("r1");
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith([]);
  });

  it("is a no-op when the id does not exist", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    folder.removeRule("does-not-exist");
    expect(folder.rules).toHaveLength(1);
    expect(cb).not.toHaveBeenCalled();
  });

  it("is a no-op on an empty rules list", () => {
    const folder = new MonitoredFolder("Literature");
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    folder.removeRule("r1");
    expect(folder.rules).toHaveLength(0);
    expect(cb).not.toHaveBeenCalled();
  });

  it("removes only the targeted rule when multiple rules are present", () => {
    const r1 = mkRule("r1");
    const r2 = mkRule("r2");
    const folder = new MonitoredFolder("Literature", [r1, r2]);
    folder.removeRule("r1");
    expect(folder.rules).toHaveLength(1);
    expect(folder.rules[0]).toBe(r2);
  });
});

describe("MonitoredFolder.modifyRule", () => {
  it("replaces the existing rule with the new rule object", () => {
    const original = mkRule("r1", "Original");
    const folder = new MonitoredFolder("Literature", [original]);
    const updated = mkRule("r1", "Updated");
    folder.modifyRule(updated);
    expect(folder.rules[0]).toBe(updated);
    expect(folder.rules[0].name).toBe("Updated");
  });

  it("fires registered render callbacks after modification", () => {
    const folder = new MonitoredFolder("Literature", [mkRule("r1")]);
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    const updated = mkRule("r1", "Updated");
    folder.modifyRule(updated);
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith([updated]);
  });

  it("does not alter the length of the rules list", () => {
    const folder = new MonitoredFolder("Literature", [
      mkRule("r1"),
      mkRule("r2"),
    ]);
    folder.modifyRule(mkRule("r1", "Updated"));
    expect(folder.rules).toHaveLength(2);
  });

  it("logs a console.error and does not modify rules when id is not found", () => {
    const folder = new MonitoredFolder("Literature", [mkRule("r1")]);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    folder.modifyRule(mkRule("nonexistent"));
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("nonexistent");
    expect(cb).not.toHaveBeenCalled();
    expect(folder.rules).toHaveLength(1);
    spy.mockRestore();
  });

  it("logs a console.error when rules list is empty", () => {
    const folder = new MonitoredFolder("Literature");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    folder.modifyRule(mkRule("r1"));
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("modifies the rule at the correct index in a multi-rule list", () => {
    const r1 = mkRule("r1", "First");
    const r2 = mkRule("r2", "Second");
    const folder = new MonitoredFolder("Literature", [r1, r2]);
    const updatedR2 = mkRule("r2", "Updated Second");
    folder.modifyRule(updatedR2);
    expect(folder.rules[0]).toBe(r1);
    expect(folder.rules[1]).toBe(updatedR2);
  });
});

describe("MonitoredFolder render callbacks", () => {
  it("addRenderCallback registers the same callback only once (Set semantics)", () => {
    const folder = new MonitoredFolder("Literature");
    const cb = vi.fn();
    folder.addRenderCallback(cb);
    folder.addRenderCallback(cb);
    folder.addRule(mkRule("r1"));
    expect(cb).toHaveBeenCalledOnce();
  });

  it("removeRenderCallback silently ignores a callback that was never registered", () => {
    const folder = new MonitoredFolder("Literature");
    const cb = vi.fn();
    expect(() => folder.removeRenderCallback(cb)).not.toThrow();
  });
});

describe("MonitoredFolder.toJSON", () => {
  it("returns a plain object with path and rules", () => {
    const rule = mkRule("r1");
    const folder = new MonitoredFolder("Literature", [rule]);
    expect(folder.toJSON()).toEqual({ path: "Literature", rules: [rule] });
  });

  it("returns empty rules array when no rules exist", () => {
    const folder = new MonitoredFolder("Archive");
    expect(folder.toJSON()).toEqual({ path: "Archive", rules: [] });
  });
});

describe("MonitoredFolder.fromJSON", () => {
  it("constructs a MonitoredFolder from JSON data", () => {
    const rule = mkRule("r1");
    const data = { path: "Literature", rules: [rule] };
    const folder = MonitoredFolder.fromJSON(data);
    expect(folder).toBeInstanceOf(MonitoredFolder);
    expect(folder.path).toBe("Literature");
    expect(folder.rules).toEqual([rule]);
  });

  it("constructs a MonitoredFolder with empty rules from JSON data", () => {
    const data = { path: "Archive", rules: [] };
    const folder = MonitoredFolder.fromJSON(data);
    expect(folder.path).toBe("Archive");
    expect(folder.rules).toHaveLength(0);
  });

  it("round-trips through toJSON and fromJSON", () => {
    const rule = mkRule("r1");
    const original = new MonitoredFolder("Literature", [rule]);
    const restored = MonitoredFolder.fromJSON(original.toJSON());
    expect(restored.path).toBe(original.path);
    expect(restored.rules).toEqual(original.rules);
  });
});
