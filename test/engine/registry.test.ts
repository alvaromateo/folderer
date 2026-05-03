import { describe, expect, it } from "vitest";
import type { ActionHandler } from "../../src/engine/action-handler";
import type { ConditionHandler } from "../../src/engine/condition-handler";
import { HandlerRegistry } from "../../src/engine/registry";

function mkCondition(type: string): ConditionHandler {
  return {
    type,
    label: `Condition ${type}`,
    fields: [],
    evaluate: () => true,
  };
}

function mkAction(type: string): ActionHandler {
  return {
    type,
    label: `Action ${type}`,
    fields: [],
    execute: async () => {},
  };
}

describe("HandlerRegistry conditions", () => {
  it("returns a registered condition by type", () => {
    const registry = new HandlerRegistry();
    const handler = mkCondition("filename-matches");
    registry.registerCondition(handler);
    expect(registry.getCondition("filename-matches")).toBe(handler);
  });

  it("returns undefined for an unregistered condition type", () => {
    const registry = new HandlerRegistry();
    expect(registry.getCondition("unknown")).toBeUndefined();
  });

  it("overwrites when the same condition type is registered twice", () => {
    const registry = new HandlerRegistry();
    const first = mkCondition("filename-matches");
    const second = mkCondition("filename-matches");
    registry.registerCondition(first);
    registry.registerCondition(second);
    expect(registry.getCondition("filename-matches")).toBe(second);
  });

  it("allConditions returns all registered conditions in insertion order", () => {
    const registry = new HandlerRegistry();
    const a = mkCondition("a");
    const b = mkCondition("b");
    registry.registerCondition(a);
    registry.registerCondition(b);
    expect(registry.allConditions()).toEqual([a, b]);
  });

  it("allConditions returns an empty array when nothing is registered", () => {
    const registry = new HandlerRegistry();
    expect(registry.allConditions()).toEqual([]);
  });
});

describe("HandlerRegistry actions", () => {
  it("returns a registered action by type", () => {
    const registry = new HandlerRegistry();
    const handler = mkAction("append-text");
    registry.registerAction(handler);
    expect(registry.getAction("append-text")).toBe(handler);
  });

  it("returns undefined for an unregistered action type", () => {
    const registry = new HandlerRegistry();
    expect(registry.getAction("unknown")).toBeUndefined();
  });

  it("overwrites when the same action type is registered twice", () => {
    const registry = new HandlerRegistry();
    const first = mkAction("append-text");
    const second = mkAction("append-text");
    registry.registerAction(first);
    registry.registerAction(second);
    expect(registry.getAction("append-text")).toBe(second);
  });

  it("allActions returns all registered actions in insertion order", () => {
    const registry = new HandlerRegistry();
    const a = mkAction("append-text");
    const b = mkAction("prepend-text");
    registry.registerAction(a);
    registry.registerAction(b);
    expect(registry.allActions()).toEqual([a, b]);
  });

  it("allActions returns an empty array when nothing is registered", () => {
    const registry = new HandlerRegistry();
    expect(registry.allActions()).toEqual([]);
  });
});

describe("HandlerRegistry isolation", () => {
  it("conditions and actions registries are independent", () => {
    const registry = new HandlerRegistry();
    registry.registerCondition(mkCondition("x"));
    expect(registry.getAction("x")).toBeUndefined();
    expect(registry.allActions()).toHaveLength(0);
  });
});
