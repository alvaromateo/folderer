import type { App, TFile } from "obsidian";
import { CONDITION_FILE_PATH } from "../../constants";
import type { ConditionData } from "../../types";
import type { ConditionEvaluator } from "./evaluator";
import { StringValueOperator, StringValueOperators } from "./operators";

export const filePathEvaluator: ConditionEvaluator = {
  type: CONDITION_FILE_PATH,
  label: "File path",
  operators: StringValueOperators,
  fields: [],
  evaluate(file: TFile, data: ConditionData, _app: App): boolean {
    const op = new StringValueOperator(data.operator ?? "");
    return op.evaluate(file.path, data.params?.value);
  },
};
