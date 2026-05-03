import type { TFile } from "obsidian";
import type { Condition } from "../../types";
import type { ConditionHandler } from "../condition-handler";

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
