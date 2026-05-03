import type { TFile } from "obsidian";
import type { Condition } from "../types";
import type { FieldDescriptor } from "./field-descriptor";

export interface ConditionHandler {
  readonly type: string;
  readonly label: string;
  readonly fields: FieldDescriptor[];
  evaluate(file: TFile, condition: Condition): boolean;
}
