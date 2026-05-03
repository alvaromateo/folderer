import type { TFile } from "obsidian";
import { describe, expect, it } from "vitest";
import { filenameMatchesCondition } from "../../../src/engine/conditions/filename-matches";
import type { Condition } from "../../../src/types";

function mkFile(name: string): TFile {
  return { name } as unknown as TFile;
}

function mkCondition(pattern: string): Condition {
  return { type: "filename-matches", params: { pattern } };
}

describe("filenameMatchesCondition metadata", () => {
  it("has type filename-matches", () => {
    expect(filenameMatchesCondition.type).toBe("filename-matches");
  });

  it("exposes a pattern field with key 'pattern'", () => {
    expect(filenameMatchesCondition.fields).toHaveLength(1);
    expect(filenameMatchesCondition.fields[0]?.key).toBe("pattern");
  });
});

describe("filenameMatchesCondition.evaluate", () => {
  it("returns true when the filename matches the regex", () => {
    const result = filenameMatchesCondition.evaluate(
      mkFile("rule-abc.md"),
      mkCondition("rule-.*\\.md"),
    );
    expect(result).toBe(true);
  });

  it("returns false when the filename does not match", () => {
    const result = filenameMatchesCondition.evaluate(
      mkFile("notes.md"),
      mkCondition("rule-.*\\.md"),
    );
    expect(result).toBe(false);
  });

  it("returns true for an empty pattern (matches everything)", () => {
    const result = filenameMatchesCondition.evaluate(
      mkFile("any-file.md"),
      mkCondition(""),
    );
    expect(result).toBe(true);
  });

  it("throws on an invalid regex pattern", () => {
    expect(() =>
      filenameMatchesCondition.evaluate(
        mkFile("file.md"),
        mkCondition("[invalid"),
      ),
    ).toThrow();
  });

  it("uses the filename only, not the full path", () => {
    const result = filenameMatchesCondition.evaluate(
      mkFile("note.md"),
      mkCondition("^note\\.md$"),
    );
    expect(result).toBe(true);
  });
});
