import type { TFile } from "obsidian";
import { describe, expect, it, vi } from "vitest";
import { prependTextAction } from "../../../src/engine/actions/prepend-text";
import type { Action } from "../../../src/types";

function mkAction(text: string): Action {
  return { type: "prepend-text", params: { text } };
}

function mkApp(
  process: (file: unknown, fn: (c: string) => string) => Promise<void>,
) {
  return { vault: { process } } as unknown as import("obsidian").App;
}

describe("prependTextAction metadata", () => {
  it("has type prepend-text", () => {
    expect(prependTextAction.type).toBe("prepend-text");
  });

  it("exposes a text field with key 'text'", () => {
    expect(prependTextAction.fields).toHaveLength(1);
    expect(prependTextAction.fields[0]?.key).toBe("text");
  });
});

describe("prependTextAction.execute", () => {
  it("calls vault.process with a function that prepends text", async () => {
    let transformer: ((c: string) => string) | undefined;
    const process = vi.fn(async (_file: unknown, fn: (c: string) => string) => {
      transformer = fn;
    });
    const app = mkApp(process);

    await prependTextAction.execute(
      {} as unknown as TFile,
      mkAction("header"),
      app,
    );

    expect(process).toHaveBeenCalledOnce();
    expect(transformer?.("existing content")).toBe("header\nexisting content");
  });

  it("prepends an empty string when params.text is absent", async () => {
    let transformer: ((c: string) => string) | undefined;
    const process = vi.fn(async (_file: unknown, fn: (c: string) => string) => {
      transformer = fn;
    });
    const app = mkApp(process);

    await prependTextAction.execute(
      {} as unknown as TFile,
      { type: "prepend-text", params: {} },
      app,
    );

    expect(transformer?.("content")).toBe("\ncontent");
  });
});
