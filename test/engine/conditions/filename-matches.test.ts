import type { App, TFile } from "obsidian";
import { describe, expect, it } from "vitest";
import { fileNameEvaluator } from "../../../src/engine/conditions/file-name";
import { filePathEvaluator } from "../../../src/engine/conditions/file-path";
import type { ConditionData } from "../../../src/types";

const mockApp = {} as App;

function mkFile(name: string, path = `Folder/${name}`): TFile {
  return { name, path } as unknown as TFile;
}

function mkCondition(operator: string, value: string): ConditionData {
  return { type: "file-name", operator, params: { value } };
}

describe("fileNameEvaluator metadata", () => {
  it("has type file-name", () => {
    expect(fileNameEvaluator.type).toBe("file-name");
  });

  it("has a label", () => {
    expect(fileNameEvaluator.label).toBe("File name");
  });

  it("exposes operators", () => {
    expect(fileNameEvaluator.operators).toBeDefined();
    expect((fileNameEvaluator.operators?.length ?? 0) > 0).toBe(true);
  });
});

describe("fileNameEvaluator.evaluate — contains", () => {
  it("returns true when filename contains the value", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("meeting-notes.md"),
      mkCondition("contains", "meeting"),
      mockApp,
    );
    expect(result).toBe(true);
  });

  it("returns false when filename does not contain the value", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("daily-log.md"),
      mkCondition("contains", "meeting"),
      mockApp,
    );
    expect(result).toBe(false);
  });
});

describe("fileNameEvaluator.evaluate — starts", () => {
  it("returns true when filename starts with the value", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("rule-2024.md"),
      mkCondition("starts", "rule-"),
      mockApp,
    );
    expect(result).toBe(true);
  });

  it("returns false when filename does not start with the value", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("my-rule.md"),
      mkCondition("starts", "rule-"),
      mockApp,
    );
    expect(result).toBe(false);
  });
});

describe("fileNameEvaluator.evaluate — ends", () => {
  it("returns true when filename ends with the value", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("note.md"),
      mkCondition("ends", ".md"),
      mockApp,
    );
    expect(result).toBe(true);
  });
});

describe("fileNameEvaluator.evaluate — matches (regex)", () => {
  it("returns true when filename matches the regex", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("rule-abc.md"),
      mkCondition("matches", "rule-.*\\.md"),
      mockApp,
    );
    expect(result).toBe(true);
  });

  it("returns false when filename does not match the regex", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("notes.md"),
      mkCondition("matches", "rule-.*\\.md"),
      mockApp,
    );
    expect(result).toBe(false);
  });

  it("returns true for an empty pattern (matches everything)", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("any-file.md"),
      mkCondition("matches", ""),
      mockApp,
    );
    expect(result).toBe(true);
  });

  it("throws on an invalid regex pattern", () => {
    expect(() =>
      fileNameEvaluator.evaluate(
        mkFile("file.md"),
        mkCondition("matches", "[invalid"),
        mockApp,
      ),
    ).toThrow();
  });

  it("uses the filename only, not the full path", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("note.md", "Deep/Nested/note.md"),
      mkCondition("matches", "^note\\.md$"),
      mockApp,
    );
    expect(result).toBe(true);
  });
});

describe("fileNameEvaluator.evaluate — exists", () => {
  it("returns true (filename always exists)", () => {
    const result = fileNameEvaluator.evaluate(
      mkFile("note.md"),
      { type: "file-name", operator: "exists" },
      mockApp,
    );
    expect(result).toBe(true);
  });
});

describe("filePathEvaluator metadata", () => {
  it("has type file-path", () => {
    expect(filePathEvaluator.type).toBe("file-path");
  });

  it("has a label", () => {
    expect(filePathEvaluator.label).toBe("File path");
  });
});

describe("filePathEvaluator.evaluate", () => {
  it("returns true when path contains the value", () => {
    const result = filePathEvaluator.evaluate(
      mkFile("note.md", "Work/Projects/note.md"),
      { type: "file-path", operator: "contains", params: { value: "Work" } },
      mockApp,
    );
    expect(result).toBe(true);
  });

  it("returns false when path does not contain the value", () => {
    const result = filePathEvaluator.evaluate(
      mkFile("note.md", "Personal/note.md"),
      { type: "file-path", operator: "contains", params: { value: "Work" } },
      mockApp,
    );
    expect(result).toBe(false);
  });
});
