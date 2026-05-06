import type { App, TFile } from "obsidian";
import type { ActionData } from "../../types";
import type { ActionExecutor } from "./executor";

export const appendTextExecutor: ActionExecutor = {
  type: "append-text",
  label: "Append text to file",
  fields: [
    {
      key: "text",
      label: "Text",
      description: "Text to append at the end of the file",
      placeholder: "folderer",
      fieldType: "text",
    },
  ],
  async execute(file: TFile, data: ActionData, app: App): Promise<void> {
    const text = data.params.text ?? "";
    await app.vault.process(file, (content) => `${content}\n${text}`);
  },
};
