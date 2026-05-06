import type { App, TFile } from "obsidian";
import { CONDITION_FILE_NAME } from "../../constants";
import type { ConditionData } from "../../types";
import type { ConditionEvaluator } from "./evaluator";
import { StringValueOperator, StringValueOperators } from "./operators";

export const fileNameEvaluator: ConditionEvaluator = {
  type: CONDITION_FILE_NAME,
  label: "File name",
  operators: StringValueOperators,
  fields: [],
  evaluate(file: TFile, data: ConditionData, _app: App): boolean {
    const op = new StringValueOperator(data.operator ?? "");
    return op.evaluate(file.name, data.params?.value);
  },
};
