import type { TFile } from "obsidian";
import { describe, expect, it, vi } from "vitest";
import { appendTextExecutor } from "../../../src/engine/actions/append-text";
import type { ActionData } from "../../../src/types";

function mkAction(text: string): ActionData {
  return { type: "append-text", params: { text } };
}

function mkApp(
  process: (file: unknown, fn: (c: string) => string) => Promise<void>,
) {
  return { vault: { process } } as unknown as import("obsidian").App;
}

describe("appendTextExecutor metadata", () => {
  it("has type append-text", () => {
    expect(appendTextExecutor.type).toBe("append-text");
  });

  it("exposes a text field with key 'text'", () => {
    expect(appendTextExecutor.fields).toHaveLength(1);
    expect(appendTextExecutor.fields[0]?.key).toBe("text");
  });
});

describe("appendTextExecutor.execute", () => {
  it("calls vault.process with a function that appends text", async () => {
    let transformer: ((c: string) => string) | undefined;
    const process = vi.fn(async (_file: unknown, fn: (c: string) => string) => {
      transformer = fn;
    });
    const app = mkApp(process);

    await appendTextExecutor.execute(
      {} as unknown as TFile,
      mkAction("folderer"),
      app,
    );

    expect(process).toHaveBeenCalledOnce();
    expect(transformer?.("existing content")).toBe(
      "existing content\nfolderer",
    );
  });

  it("appends an empty string when params.text is absent", async () => {
    let transformer: ((c: string) => string) | undefined;
    const process = vi.fn(async (_file: unknown, fn: (c: string) => string) => {
      transformer = fn;
    });
    const app = mkApp(process);

    await appendTextExecutor.execute(
      {} as unknown as TFile,
      { type: "append-text", params: {} },
      app,
    );

    expect(transformer?.("content")).toBe("content\n");
  });
});
