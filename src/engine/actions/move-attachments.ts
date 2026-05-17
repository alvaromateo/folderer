import { type App, Notice, type TFile } from "obsidian";
import { ACTION_MOVE_ATTACHMENTS } from "../../constants";
import type { ActionData } from "../../types";
import { getParentFolder } from "../../utils";
import type { ActionExecutor } from "./executor";

export const moveAttachmentsExecutor: ActionExecutor = {
  type: ACTION_MOVE_ATTACHMENTS,
  label: "Move attachments",
  fields: [
    {
      key: "folder",
      label: "Attachments folder",
      description:
        "Subfolder name where attachments will be moved (relative to the note's location)",
      placeholder: "Attachments",
      fieldType: "text",
    },
  ],

  async execute(file: TFile, data: ActionData, app: App): Promise<void> {
    const folderName = (data.params.folder ?? "").trim() || "Attachments";
    const noteFolder = getParentFolder(file.path);
    const attachmentsFolderPath =
      noteFolder === "/" ? folderName : `${noteFolder}/${folderName}`;

    const embeds = app.metadataCache.getFileCache(file)?.embeds ?? [];
    if (embeds.length === 0) return;

    // Resolve embeds to TFiles, deduplicating and skipping note links
    const seen = new Set<string>();
    const attachments: TFile[] = [];
    for (const embed of embeds) {
      const attachment = app.metadataCache.getFirstLinkpathDest(
        embed.link,
        file.path,
      );
      if (!attachment || attachment.extension === "md") continue;
      if (seen.has(attachment.path)) continue;
      seen.add(attachment.path);
      attachments.push(attachment);
    }

    if (attachments.length === 0) return;

    if (!app.vault.getAbstractFileByPath(attachmentsFolderPath)) {
      try {
        await app.vault.createFolder(attachmentsFolderPath);
      } catch {
        // Folder was created concurrently between the existence check and this call
        // Do nothing
      }
    }

    for (const attachment of attachments) {
      const newPath = `${attachmentsFolderPath}/${attachment.name}`;
      if (newPath === attachment.path) continue;
      if (app.vault.getAbstractFileByPath(newPath)) {
        new Notice(
          `Folderer: could not move "${attachment.name}" — a file already exists at "${newPath}"`,
        );
        continue;
      }
      await app.fileManager.renameFile(attachment, newPath);
    }
  },
};
