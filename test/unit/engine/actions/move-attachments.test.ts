import type { EmbedCache, TFile } from "obsidian";
import { describe, expect, it, vi } from "vitest";
import { moveAttachmentsExecutor } from "../../../../src/engine/actions/move-attachments";
import type { ActionData } from "../../../../src/types";

vi.mock("obsidian", async (importOriginal) => {
  const original = await importOriginal<typeof import("obsidian")>();
  return {
    ...original,
    Notice: vi.fn(),
  };
});

// Build a minimal TFile-like object for the note being processed
function mkFile(path: string): TFile {
  const parts = path.split("/");
  return { path, name: parts[parts.length - 1] ?? path } as unknown as TFile;
}

// Build a minimal TFile-like object for an attachment
function mkAttachment(path: string, extension = "png"): TFile {
  const parts = path.split("/");
  return {
    path,
    name: parts[parts.length - 1] ?? path,
    extension,
  } as unknown as TFile;
}

function mkEmbed(link: string): EmbedCache {
  return { link } as EmbedCache;
}

interface AppOptions {
  embeds?: EmbedCache[];
  // Map from embed.link -> resolved TFile | null
  resolveLink?: (link: string, sourcePath: string) => TFile | null;
  // Paths that already exist in the vault
  existingPaths?: string[];
}

function mkApp(opts: AppOptions = {}): import("obsidian").App {
  const { embeds = [], resolveLink = () => null, existingPaths = [] } = opts;

  const createFolder = vi.fn(async () => {});
  const renameFile = vi.fn(async () => {});

  return {
    metadataCache: {
      getFileCache: (_file: unknown) => ({ embeds }),
      getFirstLinkpathDest: (link: string, sourcePath: string) =>
        resolveLink(link, sourcePath),
    },
    vault: {
      getAbstractFileByPath: (path: string) =>
        existingPaths.includes(path) ? {} : null,
      createFolder,
    },
    fileManager: {
      renameFile,
    },
  } as unknown as import("obsidian").App;
}

// Helper to pull the mocked functions back out for assertions
function getMocks(app: import("obsidian").App) {
  return {
    createFolder: app.vault.createFolder as ReturnType<typeof vi.fn>,
    renameFile: (
      app as unknown as {
        fileManager: { renameFile: ReturnType<typeof vi.fn> };
      }
    ).fileManager.renameFile,
  };
}

function mkAction(folder?: string): ActionData {
  return {
    type: "move-attachments",
    params: folder !== undefined ? { folder } : {},
  };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor metadata", () => {
  it("has type move-attachments", () => {
    expect(moveAttachmentsExecutor.type).toBe("move-attachments");
  });

  it("has label 'Move attachments'", () => {
    expect(moveAttachmentsExecutor.label).toBe("Move attachments");
  });

  it("exposes exactly one field", () => {
    expect(moveAttachmentsExecutor.fields).toHaveLength(1);
  });

  it("field has key 'folder'", () => {
    expect(moveAttachmentsExecutor.fields[0]?.key).toBe("folder");
  });

  it("field has fieldType 'text'", () => {
    expect(moveAttachmentsExecutor.fields[0]?.fieldType).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// Folder name resolution
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor folder name resolution", () => {
  it("uses 'Attachments' when params.folder is absent", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).toHaveBeenCalledWith(img, "Notes/Attachments/img.png");
  });

  it("uses 'Attachments' when params.folder is an empty string", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(""),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).toHaveBeenCalledWith(img, "Notes/Attachments/img.png");
  });

  it("uses 'Attachments' when params.folder is whitespace-only", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction("   "),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).toHaveBeenCalledWith(img, "Notes/Attachments/img.png");
  });

  it("uses a custom folder name when provided", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction("Media"),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).toHaveBeenCalledWith(img, "Notes/Media/img.png");
  });
});

// ---------------------------------------------------------------------------
// Early-return conditions
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor early return", () => {
  it("does not call renameFile when embeds is empty", async () => {
    const app = mkApp({ embeds: [] });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile, createFolder } = getMocks(app);
    expect(renameFile).not.toHaveBeenCalled();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("does not call renameFile when all embeds resolve to null", async () => {
    const app = mkApp({
      embeds: [mkEmbed("missing.png"), mkEmbed("also-missing.png")],
      resolveLink: () => null,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile, createFolder } = getMocks(app);
    expect(renameFile).not.toHaveBeenCalled();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("does not call renameFile when all embeds resolve to .md files", async () => {
    const mdFile = mkAttachment("Notes/linked.md", "md");
    const app = mkApp({
      embeds: [mkEmbed("linked.md")],
      resolveLink: () => mdFile,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile, createFolder } = getMocks(app);
    expect(renameFile).not.toHaveBeenCalled();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("does not create folder when no attachments remain after filtering", async () => {
    // mix of unresolvable and .md links → nothing passes the filter
    const mdFile = mkAttachment("Notes/doc.md", "md");
    const app = mkApp({
      embeds: [mkEmbed("missing.png"), mkEmbed("doc.md")],
      resolveLink: (link) => (link === "doc.md" ? mdFile : null),
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { createFolder } = getMocks(app);
    expect(createFolder).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor deduplication", () => {
  it("calls renameFile only once when the same attachment is embedded twice", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png"), mkEmbed("img.png")],
      resolveLink: () => img,
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Folder creation
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor folder creation", () => {
  it("creates the attachments folder when it does not exist", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
      existingPaths: [], // folder absent
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { createFolder } = getMocks(app);
    expect(createFolder).toHaveBeenCalledOnce();
    expect(createFolder).toHaveBeenCalledWith("Notes/Attachments");
  });

  it("does not create the folder when it already exists", async () => {
    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
      existingPaths: ["Notes/Attachments"], // folder present
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { createFolder } = getMocks(app);
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("calls createFolder only once even with multiple attachments", async () => {
    const img1 = mkAttachment("Notes/img1.png");
    const img2 = mkAttachment("Notes/img2.png");
    const app = mkApp({
      embeds: [mkEmbed("img1.png"), mkEmbed("img2.png")],
      resolveLink: (link) => (link === "img1.png" ? img1 : img2),
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { createFolder } = getMocks(app);
    expect(createFolder).toHaveBeenCalledOnce();
  });

  it("swallows createFolder error and still calls renameFile when folder is created concurrently (race condition guard)", async () => {
    // Change #6: createFolder can throw if another process creates the folder between the
    // existence check and the createFolder call. The error is caught and ignored so that
    // the rename loop still executes.
    const img = mkAttachment("Notes/img.png");

    // Build the app with no existing paths so getAbstractFileByPath returns null,
    // but override createFolder to throw as if the folder was created concurrently.
    const renameFile = vi.fn(async () => {});
    const createFolder = vi.fn(async () => {
      throw new Error("Folder already exists");
    });

    const app = {
      metadataCache: {
        getFileCache: () => ({ embeds: [mkEmbed("img.png")] }),
        getFirstLinkpathDest: () => img,
      },
      vault: {
        getAbstractFileByPath: (_path: string) => null,
        createFolder,
      },
      fileManager: { renameFile },
    } as unknown as import("obsidian").App;

    // Should not throw
    await expect(
      moveAttachmentsExecutor.execute(mkFile("Notes/note.md"), mkAction(), app),
    ).resolves.toBeUndefined();

    expect(createFolder).toHaveBeenCalledOnce();
    expect(renameFile).toHaveBeenCalledOnce();
    expect(renameFile).toHaveBeenCalledWith(img, "Notes/Attachments/img.png");
  });
});

// ---------------------------------------------------------------------------
// Per-attachment skip conditions
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor per-attachment skips", () => {
  it("skips an attachment that is already in the target folder", async () => {
    // attachment is already at Notes/Attachments/img.png
    const img = mkAttachment("Notes/Attachments/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
      existingPaths: ["Notes/Attachments"],
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).not.toHaveBeenCalled();
  });

  it("skips an attachment when the target path already exists (conflict) and emits a Notice", async () => {
    // Change #3: instead of silently skipping, the code now calls new Notice(...)
    const { Notice } = await import("obsidian");
    vi.mocked(Notice).mockClear();

    const img = mkAttachment("Notes/img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
      // Both the folder and the target file already exist
      existingPaths: ["Notes/Attachments", "Notes/Attachments/img.png"],
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Notes/note.md"),
      mkAction(),
      app,
    );

    const { renameFile } = getMocks(app);
    expect(renameFile).not.toHaveBeenCalled();
    expect(Notice).toHaveBeenCalledOnce();
    expect(Notice).toHaveBeenCalledWith(
      'Folderer: could not move "img.png" — a file already exists at "Notes/Attachments/img.png"',
    );
  });
});

// ---------------------------------------------------------------------------
// Multiple attachments
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor multiple attachments", () => {
  it("renames all attachments and creates the folder once", async () => {
    const img1 = mkAttachment("Assets/photo.jpg", "jpg");
    const img2 = mkAttachment("Assets/chart.svg", "svg");
    const img3 = mkAttachment("Assets/data.csv", "csv");

    const app = mkApp({
      embeds: [mkEmbed("photo.jpg"), mkEmbed("chart.svg"), mkEmbed("data.csv")],
      resolveLink: (link) => {
        if (link === "photo.jpg") return img1;
        if (link === "chart.svg") return img2;
        return img3;
      },
    });

    await moveAttachmentsExecutor.execute(
      mkFile("Project/note.md"),
      mkAction(),
      app,
    );

    const { createFolder, renameFile } = getMocks(app);
    expect(createFolder).toHaveBeenCalledOnce();
    expect(createFolder).toHaveBeenCalledWith("Project/Attachments");
    expect(renameFile).toHaveBeenCalledTimes(3);
    expect(renameFile).toHaveBeenCalledWith(
      img1,
      "Project/Attachments/photo.jpg",
    );
    expect(renameFile).toHaveBeenCalledWith(
      img2,
      "Project/Attachments/chart.svg",
    );
    expect(renameFile).toHaveBeenCalledWith(
      img3,
      "Project/Attachments/data.csv",
    );
  });
});

// ---------------------------------------------------------------------------
// Vault-root note (no parent folder)
// ---------------------------------------------------------------------------

describe("moveAttachmentsExecutor vault-root note", () => {
  it("places the attachments folder at 'Attachments' (no leading slash) when note is at vault root", async () => {
    // getParentFolder("note.md") returns "/" because lastIndexOf("/") === -1
    // Change #5: noteFolder === "/" → use folderName directly, not `/${folderName}`
    const img = mkAttachment("img.png");
    const app = mkApp({
      embeds: [mkEmbed("img.png")],
      resolveLink: () => img,
    });

    await moveAttachmentsExecutor.execute(mkFile("note.md"), mkAction(), app);

    const { createFolder, renameFile } = getMocks(app);
    expect(createFolder).toHaveBeenCalledOnce();
    expect(createFolder).toHaveBeenCalledWith("Attachments");
    expect(renameFile).toHaveBeenCalledWith(img, "Attachments/img.png");
  });
});
