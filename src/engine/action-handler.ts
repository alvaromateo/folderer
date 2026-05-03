import type { App, TFile } from "obsidian";
import type { Action } from "../types";
import type { FieldDescriptor } from "./field-descriptor";

export interface ActionHandler {
  readonly type: string;
  readonly label: string;
  readonly fields: FieldDescriptor[];
  execute(file: TFile, action: Action, app: App): Promise<void>;
}
