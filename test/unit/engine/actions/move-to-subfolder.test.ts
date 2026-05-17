import type { TFile } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  moveToDateSubfolderExecutor,
  moveToPropertySubfolderExecutor,
} from "../../../../src/engine/actions/move-to-subfolder";
import type { ActionData } from "../../../../src/types";

// Fixed date used across all date-executor tests: 2024-03-05
const FIXED_DATE = new Date(2024, 2, 5); // month is 0-indexed

function mkFile(path: string, name: string): TFile {
  return { path, name } as unknown as TFile;
}

function mkApp({
  getAbstractFileByPath = vi.fn().mockReturnValue(null),
  createFolder = vi.fn().mockResolvedValue(undefined),
  renameFile = vi.fn().mockResolvedValue(undefined),
  getFileCache = vi.fn().mockReturnValue(undefined),
}: {
  getAbstractFileByPath?: ReturnType<typeof vi.fn>;
  createFolder?: ReturnType<typeof vi.fn>;
  renameFile?: ReturnType<typeof vi.fn>;
  getFileCache?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    vault: { getAbstractFileByPath, createFolder },
    fileManager: { renameFile },
    metadataCache: { getFileCache },
  } as unknown as import("obsidian").App;
}

function mkDateAction(pattern?: string): ActionData {
  return {
    type: "move-to-date-subfolder",
    params: pattern !== undefined ? { pattern } : {},
  };
}

function mkPropertyAction(property?: string): ActionData {
  return {
    type: "move-to-property-subfolder",
    params: property !== undefined ? { property } : {},
  };
}

// ─── moveToDateSubfolderExecutor metadata ────────────────────────────────────

describe("moveToDateSubfolderExecutor metadata", () => {
  it("has type move-to-date-subfolder", () => {
    expect(moveToDateSubfolderExecutor.type).toBe("move-to-date-subfolder");
  });

  it("has a non-empty label", () => {
    expect(moveToDateSubfolderExecutor.label).toBeTruthy();
  });

  it("exposes exactly one field with key 'pattern' and fieldType 'text'", () => {
    expect(moveToDateSubfolderExecutor.fields).toHaveLength(1);
    expect(moveToDateSubfolderExecutor.fields[0]?.key).toBe("pattern");
    expect(moveToDateSubfolderExecutor.fields[0]?.fieldType).toBe("text");
  });
});

// ─── moveToPropertySubfolderExecutor metadata ────────────────────────────────

describe("moveToPropertySubfolderExecutor metadata", () => {
  it("has type move-to-property-subfolder", () => {
    expect(moveToPropertySubfolderExecutor.type).toBe(
      "move-to-property-subfolder",
    );
  });

  it("has a non-empty label", () => {
    expect(moveToPropertySubfolderExecutor.label).toBeTruthy();
  });

  it("exposes exactly one field with key 'property' and fieldType 'text'", () => {
    expect(moveToPropertySubfolderExecutor.fields).toHaveLength(1);
    expect(moveToPropertySubfolderExecutor.fields[0]?.key).toBe("property");
    expect(moveToPropertySubfolderExecutor.fields[0]?.fieldType).toBe("text");
  });
});

// ─── moveToDateSubfolderExecutor.execute ─────────────────────────────────────

describe("moveToDateSubfolderExecutor.execute", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls renameFile with the correct path using the default MM-YYYY pattern", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const app = mkApp({ renameFile });
    const file = mkFile("Literature/note.md", "note.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction(), app);

    // FIXED_DATE = 2024-03-05 → MM=03, YYYY=2024
    expect(renameFile).toHaveBeenCalledOnce();
    expect(renameFile).toHaveBeenCalledWith(file, "Literature/03-2024/note.md");
  });

  it("uses MM-YYYY as default when params.pattern is absent", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const app = mkApp({ renameFile });
    const file = mkFile("Archive/doc.md", "doc.md");

    await moveToDateSubfolderExecutor.execute(
      file,
      { type: "move-to-date-subfolder", params: {} },
      app,
    );

    expect(renameFile).toHaveBeenCalledWith(file, "Archive/03-2024/doc.md");
  });

  describe("token substitution", () => {
    it("substitutes YYYY with the full 4-digit year", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(
        file,
        mkDateAction("YYYY"),
        app,
      );

      expect(renameFile).toHaveBeenCalledWith(file, "folder/2024/f.md");
    });

    it("substitutes YY with last 2 digits of year", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("YY"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/24/f.md");
    });

    it("substitutes MM with zero-padded month (single-digit month)", async () => {
      // FIXED_DATE month = March = 03
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("MM"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/03/f.md");
    });

    it("substitutes MM with zero-padded month (double-digit month)", async () => {
      vi.setSystemTime(new Date(2024, 9, 15)); // October = 10
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("MM"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/10/f.md");
    });

    it("substitutes M without padding (single-digit month)", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("M"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/3/f.md");
    });

    it("substitutes DD with zero-padded day (single-digit day)", async () => {
      // FIXED_DATE day = 5 → 05
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("DD"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/05/f.md");
    });

    it("substitutes DD with zero-padded day (double-digit day)", async () => {
      vi.setSystemTime(new Date(2024, 2, 15)); // 15th
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("DD"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/15/f.md");
    });

    it("substitutes D without padding (single-digit day)", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(file, mkDateAction("D"), app);

      expect(renameFile).toHaveBeenCalledWith(file, "folder/5/f.md");
    });

    it("YYYY wins over YY when both could match — left-to-right regex ensures YYYY is consumed first", async () => {
      // Pattern "YYYY" should not partially match as "YY" + literal "YY"
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(
        file,
        mkDateAction("YYYY-YY"),
        app,
      );

      expect(renameFile).toHaveBeenCalledWith(file, "folder/2024-24/f.md");
    });

    it("MM wins over M when both could match — MM is consumed first in the pattern", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(
        file,
        mkDateAction("MM-M"),
        app,
      );

      expect(renameFile).toHaveBeenCalledWith(file, "folder/03-3/f.md");
    });

    it("substitutes multiple different tokens in a single pattern", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("Notes/f.md", "f.md");

      // FIXED_DATE = 2024-03-05 → YYYY=2024 MM=03 DD=05
      // Pattern "YYYY-MM-DD" resolves to "2024-03-05"
      await moveToDateSubfolderExecutor.execute(
        file,
        mkDateAction("YYYY-MM-DD"),
        app,
      );

      expect(renameFile).toHaveBeenCalledWith(file, "Notes/2024-03-05/f.md");
    });

    it("leaves non-token text unchanged in pattern", async () => {
      const renameFile = vi.fn().mockResolvedValue(undefined);
      const app = mkApp({ renameFile });
      const file = mkFile("folder/f.md", "f.md");

      await moveToDateSubfolderExecutor.execute(
        file,
        mkDateAction("year-YYYY-archive"),
        app,
      );

      expect(renameFile).toHaveBeenCalledWith(
        file,
        "folder/year-2024-archive/f.md",
      );
    });
  });

  it("creates the target folder when getAbstractFileByPath returns null", async () => {
    const createFolder = vi.fn().mockResolvedValue(undefined);
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getAbstractFileByPath = vi.fn().mockReturnValue(null);
    const app = mkApp({ getAbstractFileByPath, createFolder, renameFile });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction("YYYY"), app);

    expect(createFolder).toHaveBeenCalledOnce();
    expect(createFolder).toHaveBeenCalledWith("Inbox/2024");
  });

  it("does NOT create the target folder when it already exists", async () => {
    const existingFolder = { path: "Inbox/2024" };
    const createFolder = vi.fn().mockResolvedValue(undefined);
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getAbstractFileByPath = vi.fn().mockReturnValue(existingFolder);
    const app = mkApp({ getAbstractFileByPath, createFolder, renameFile });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction("YYYY"), app);

    expect(createFolder).not.toHaveBeenCalled();
    expect(renameFile).toHaveBeenCalledOnce();
  });

  it("is a no-op when the resolved subfolder is an empty string", async () => {
    // An empty pattern resolves to "" after token substitution (no tokens match)
    // We can force this by using a pattern that becomes empty after strip — e.g. all slashes
    const createFolder = vi.fn();
    const renameFile = vi.fn();
    const app = mkApp({ createFolder, renameFile });
    const file = mkFile("folder/f.md", "f.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction("///"), app);

    expect(createFolder).not.toHaveBeenCalled();
    expect(renameFile).not.toHaveBeenCalled();
  });

  it("strips leading slashes from pattern output before building the path", async () => {
    // Pattern "/YYYY" → after strip → "2024"
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const app = mkApp({ renameFile });
    const file = mkFile("folder/f.md", "f.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction("/YYYY"), app);

    expect(renameFile).toHaveBeenCalledWith(file, "folder/2024/f.md");
  });

  it("strips trailing slashes from pattern output before building the path", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const app = mkApp({ renameFile });
    const file = mkFile("folder/f.md", "f.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction("YYYY/"), app);

    expect(renameFile).toHaveBeenCalledWith(file, "folder/2024/f.md");
  });

  it("handles a file at vault root (no parent directory)", async () => {
    // getParentFolder("note.md") returns "/" for paths with no slash
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const app = mkApp({ renameFile });
    const file = mkFile("note.md", "note.md");

    await moveToDateSubfolderExecutor.execute(file, mkDateAction("YYYY"), app);

    expect(renameFile).toHaveBeenCalledWith(file, "//2024/note.md");
  });
});

// ─── moveToPropertySubfolderExecutor.execute ─────────────────────────────────

describe("moveToPropertySubfolderExecutor.execute", () => {
  it("moves the file to the subfolder named by the frontmatter property value", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "archive" } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).toHaveBeenCalledOnce();
    expect(renameFile).toHaveBeenCalledWith(file, "Inbox/archive/note.md");
  });

  it("is a no-op when the property param is missing", async () => {
    const renameFile = vi.fn();
    const app = mkApp({ renameFile });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      { type: "move-to-property-subfolder", params: {} },
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when the property param is an empty string", async () => {
    const renameFile = vi.fn();
    const app = mkApp({ renameFile });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction(""),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when getFileCache returns undefined (no cache)", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi.fn().mockReturnValue(undefined);
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when frontmatter is absent (undefined)", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi.fn().mockReturnValue({ frontmatter: undefined });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when the property key is not present in frontmatter", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { other: "value" } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when the property value is a number", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: 42 } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when the property value is a boolean", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: true } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when the property value is null", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: null } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("is a no-op when the property value is an array", async () => {
    const renameFile = vi.fn();
    const getFileCache = vi.fn().mockReturnValue({
      frontmatter: { destination: ["folder1", "folder2"] },
    });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
  });

  it("strips leading slashes from property value before building the path", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "/archive" } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).toHaveBeenCalledWith(file, "Inbox/archive/note.md");
  });

  it("strips trailing slashes from property value before building the path", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "archive/" } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).toHaveBeenCalledWith(file, "Inbox/archive/note.md");
  });

  it("strips both leading and trailing slashes from property value", async () => {
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "///archive///" } });
    const app = mkApp({ renameFile, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).toHaveBeenCalledWith(file, "Inbox/archive/note.md");
  });

  it("is a no-op when property value consists entirely of slashes (normalizes to empty)", async () => {
    const renameFile = vi.fn();
    const createFolder = vi.fn();
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "///" } });
    const app = mkApp({ renameFile, createFolder, getFileCache });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(renameFile).not.toHaveBeenCalled();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("creates the target folder when it does not exist", async () => {
    const createFolder = vi.fn().mockResolvedValue(undefined);
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getAbstractFileByPath = vi.fn().mockReturnValue(null);
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "sorted" } });
    const app = mkApp({
      getAbstractFileByPath,
      createFolder,
      renameFile,
      getFileCache,
    });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(createFolder).toHaveBeenCalledOnce();
    expect(createFolder).toHaveBeenCalledWith("Inbox/sorted");
    expect(renameFile).toHaveBeenCalledWith(file, "Inbox/sorted/note.md");
  });

  it("does NOT create the target folder when it already exists", async () => {
    const createFolder = vi.fn();
    const renameFile = vi.fn().mockResolvedValue(undefined);
    const getAbstractFileByPath = vi
      .fn()
      .mockReturnValue({ path: "Inbox/sorted" });
    const getFileCache = vi
      .fn()
      .mockReturnValue({ frontmatter: { destination: "sorted" } });
    const app = mkApp({
      getAbstractFileByPath,
      createFolder,
      renameFile,
      getFileCache,
    });
    const file = mkFile("Inbox/note.md", "note.md");

    await moveToPropertySubfolderExecutor.execute(
      file,
      mkPropertyAction("destination"),
      app,
    );

    expect(createFolder).not.toHaveBeenCalled();
    expect(renameFile).toHaveBeenCalledOnce();
  });
});
