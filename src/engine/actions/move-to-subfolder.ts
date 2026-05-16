import type { App, TFile } from "obsidian";
import type { ActionData } from "../../types";
import { getParentFolder } from "../../utils";
import type { ActionExecutor } from "./executor";

function formatDatePattern(pattern: string, date: Date): string {
  // Longer tokens must precede shorter ones so YYYY wins over YY, MM over M, DD over D
  return pattern.replace(/YYYY|YY|MM|M|DD|D/g, (token) => {
    switch (token) {
      case "YYYY":
        return date.getFullYear().toString();
      case "YY":
        return date.getFullYear().toString().slice(-2);
      case "MM":
        return String(date.getMonth() + 1).padStart(2, "0");
      case "M":
        return String(date.getMonth() + 1);
      case "DD":
        return String(date.getDate()).padStart(2, "0");
      case "D":
        return String(date.getDate());
      default:
        return token;
    }
  });
}

async function moveToSubfolder(
  file: TFile,
  subfolder: string,
  app: App,
): Promise<void> {
  const normalized = subfolder.replace(/^\/+|\/+$/g, "").trim();
  if (!normalized) return;

  const monitoredFolderPath = getParentFolder(file.path);
  const targetFolderPath = `${monitoredFolderPath}/${normalized}`;
  const newFilePath = `${targetFolderPath}/${file.name}`;
  if (newFilePath === file.path) return;

  if (!app.vault.getAbstractFileByPath(targetFolderPath)) {
    await app.vault.createFolder(targetFolderPath);
  }
  await app.fileManager.renameFile(file, newFilePath);
}

export const moveToDateSubfolderExecutor: ActionExecutor = {
  type: "move-to-date-subfolder",
  label: "Move to date subfolder",
  fields: [
    {
      key: "pattern",
      label: "Date pattern",
      description:
        "Subfolder name derived from the current date. Tokens: YYYY, YY, MM, M, DD, D",
      placeholder: "MM-YYYY",
      fieldType: "text",
    },
  ],
  async execute(file: TFile, data: ActionData, app: App): Promise<void> {
    const pattern = data.params.pattern ?? "MM-YYYY";
    const subfolder = formatDatePattern(pattern, new Date());
    await moveToSubfolder(file, subfolder, app);
  },
};

export const moveToPropertySubfolderExecutor: ActionExecutor = {
  type: "move-to-property-subfolder",
  label: "Move to property subfolder",
  fields: [
    {
      key: "property",
      label: "Property",
      description:
        "Frontmatter property whose string value is used as the subfolder path",
      placeholder: "destination",
      fieldType: "text",
    },
  ],
  async execute(file: TFile, data: ActionData, app: App): Promise<void> {
    const prop = data.params.property;
    if (!prop) return;
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter) return;
    const subfolder = frontmatter[prop];
    if (typeof subfolder !== "string") return;
    await moveToSubfolder(file, subfolder, app);
  },
};
