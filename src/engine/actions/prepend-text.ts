import type { App, TFile } from "obsidian";
import type { Action } from "../../types";
import type { ActionHandler } from "../action-handler";

export const prependTextAction: ActionHandler = {
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

  async execute(file: TFile, action: Action, app: App): Promise<void> {
    const text = action.params.text ?? "";
    await app.vault.process(file, (content) => `${text}\n${content}`);
  },
};
