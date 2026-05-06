import type { App, TFile } from "obsidian";
import type { ConditionData } from "../../types";
import type { FieldDescriptor } from "../field-descriptor";
import type { OperatorDescriptor } from "./operators";

export interface ConditionEvaluator {
  readonly type: string;
  readonly label: string;
  readonly operators?: readonly OperatorDescriptor[];
  readonly fields: readonly FieldDescriptor[];
  evaluate(file: TFile, data: ConditionData, app: App): boolean;
}
