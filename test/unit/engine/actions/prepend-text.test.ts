import type { TFile } from "obsidian";
import { describe, expect, it, vi } from "vitest";
import { prependTextExecutor } from "../../../../src/engine/actions/prepend-text";
import type { ActionData } from "../../../../src/types";

function mkAction(text: string): ActionData {
  return { type: "prepend-text", params: { text } };
}

function mkApp(
  process: (file: unknown, fn: (c: string) => string) => Promise<void>,
) {
  return { vault: { process } } as unknown as import("obsidian").App;
}

describe("prependTextExecutor metadata", () => {
  it("has type prepend-text", () => {
    expect(prependTextExecutor.type).toBe("prepend-text");
  });

  it("exposes a text field with key 'text'", () => {
    expect(prependTextExecutor.fields).toHaveLength(1);
    expect(prependTextExecutor.fields[0]?.key).toBe("text");
  });
});

describe("prependTextExecutor.execute", () => {
  it("calls vault.process with a function that prepends text", async () => {
    let transformer: ((c: string) => string) | undefined;
    const process = vi.fn(async (_file: unknown, fn: (c: string) => string) => {
      transformer = fn;
    });
    const app = mkApp(process);

    await prependTextExecutor.execute(
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

    await prependTextExecutor.execute(
      {} as unknown as TFile,
      { type: "prepend-text", params: {} },
      app,
    );

    expect(transformer?.("content")).toBe("\ncontent");
  });
});
