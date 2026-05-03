import type { App, TFile } from "obsidian";
import type { Action } from "../../types";
import type { ActionHandler } from "../action-handler";

export const appendTextAction: ActionHandler = {
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

  async execute(file: TFile, action: Action, app: App): Promise<void> {
    const text = action.params.text ?? "";
    await app.vault.process(file, (content) => `${content}\n${text}`);
  },
};
