import type { TFile } from "obsidian";
import { CONDITION_FILE_NAME } from "../../constants";
//import type { Condition } from "../../types";
//import type { ConditionHandler } from "../condition-handler";
import { SingleCondition } from "./condition";
import { StringValueOperator } from "./operators";

/*
export const filenameMatchesCondition: ConditionHandler = {
  type: "filename-matches",
  label: "Filename matches pattern",
  fields: [
    {
      key: "pattern",
      label: "Pattern",
      description: "Regex matched against the filename (without path)",
      placeholder: "rule-.*\\.md",
      fieldType: "text",
    },
  ],

  evaluate(file: TFile, condition: Condition): boolean {
    const pattern = condition.params.pattern ?? "";
    return new RegExp(pattern).test(file.name);
  },
};
*/

export class FileNameCondition extends SingleCondition {
  static type: string = "file-name";
  static label: string = "File name";

  constructor(operator: string, params: Record<string, string>) {
    super(CONDITION_FILE_NAME, operator, params);
  }

  public evaluate(file: TFile): boolean {
    const op = new StringValueOperator(this.operator);
    const value = this.params.value;
    return op.evaluate(file.name, value);
  }
}
