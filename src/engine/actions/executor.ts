import type { App, TFile } from "obsidian";
import type { ActionData } from "../../types";
import type { FieldDescriptor } from "../field-descriptor";

export interface ActionExecutor {
  readonly type: string;
  readonly label: string;
  readonly fields: readonly FieldDescriptor[];
  execute(file: TFile, data: ActionData, app: App): Promise<void>;
}
