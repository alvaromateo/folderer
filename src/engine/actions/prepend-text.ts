import type { App, TFile } from "obsidian";
import type { ActionData } from "../../types";
import type { ActionExecutor } from "./executor";

export const prependTextExecutor: ActionExecutor = {
  type: "prepend-text",
  label: "Prepend text to file",
  fields: [
    {
      key: "text",
      label: "Text",
      description: "Text to prepend at the start of the file",
      placeholder: "folderer",
      fieldType: "text",
    },
  ],
  async execute(file: TFile, data: ActionData, app: App): Promise<void> {
    const text = data.params.text ?? "";
    await app.vault.process(file, (content) => `${text}\n${content}`);
  },
};
