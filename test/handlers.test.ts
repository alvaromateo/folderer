import { describe, expect, it } from "vitest";
import {
  getMatchingFolder,
  getParentFolder,
  isCrossfolderMove,
  isInMonitoredFolder,
} from "../src/handlers";
import { MonitoredFolder } from "../src/settings/folder-settings";

function mkFolders(...paths: string[]): MonitoredFolder[] {
  return paths.map((path) => new MonitoredFolder(path));
}

describe("getParentFolder", () => {
  it("returns the directory portion of a nested path", () => {
    expect(getParentFolder("Literature/note.md")).toBe("Literature");
  });

  it("returns a nested parent for a deeply nested path", () => {
    expect(getParentFolder("Projects/Active/note.md")).toBe("Projects/Active");
  });

  it('returns root sentinel "/" for a top-level file', () => {
    expect(getParentFolder("note.md")).toBe("/");
  });
});

describe("isCrossfolderMove", () => {
  it("returns true when moving to a different folder", () => {
    expect(isCrossfolderMove("Literature/note.md", "Drafts/note.md")).toBe(
      true,
    );
  });

  it("returns false when renaming within the same folder", () => {
    expect(
      isCrossfolderMove("Literature/new-name.md", "Literature/old-name.md"),
    ).toBe(false);
  });

  it("returns true when moving from root to a subfolder", () => {
    expect(isCrossfolderMove("Literature/note.md", "note.md")).toBe(true);
  });

  it("returns true when moving from a subfolder to root", () => {
    expect(isCrossfolderMove("note.md", "Literature/note.md")).toBe(true);
  });
});

describe("isInMonitoredFolder", () => {
  it("returns true when the file is directly inside a monitored folder", () => {
    expect(
      isInMonitoredFolder(
        "Literature/note.md",
        mkFolders("Literature", "Archive"),
      ),
    ).toBe(true);
  });

  it("returns false when the file is in a non-monitored folder", () => {
    expect(
      isInMonitoredFolder("Drafts/note.md", mkFolders("Literature", "Archive")),
    ).toBe(false);
  });

  it("returns false when monitored folders list is empty", () => {
    expect(isInMonitoredFolder("Literature/note.md", [])).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(
      isInMonitoredFolder("literature/note.md", mkFolders("Literature")),
    ).toBe(false);
  });

  it("does not match a file in a subfolder of a monitored folder", () => {
    expect(
      isInMonitoredFolder("Literature/Sub/note.md", mkFolders("Literature")),
    ).toBe(false);
  });

  it("returns false for a top-level file when no root is monitored", () => {
    expect(isInMonitoredFolder("note.md", mkFolders("Literature"))).toBe(false);
  });
});

describe("getMatchingFolder", () => {
  it("returns the matching MonitoredFolder for a file inside it", () => {
    const folders = mkFolders("Literature", "Archive");
    const result = getMatchingFolder("Literature/note.md", folders);
    expect(result?.path).toBe("Literature");
  });

  it("returns the correct folder when multiple are monitored", () => {
    const folders = mkFolders("Literature", "Archive");
    const result = getMatchingFolder("Archive/note.md", folders);
    expect(result?.path).toBe("Archive");
  });

  it("returns undefined for a file not in any monitored folder", () => {
    const result = getMatchingFolder("Drafts/note.md", mkFolders("Literature"));
    expect(result).toBeUndefined();
  });

  it("returns undefined for an empty monitored folders list", () => {
    expect(getMatchingFolder("Literature/note.md", [])).toBeUndefined();
  });
});
