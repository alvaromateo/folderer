import type { App, TFile } from "obsidian";
import { CONDITION_PROPERTY } from "../../constants";
import type { ConditionData } from "../../types";
import { getFrontMatterString } from "../utils";
import type { ConditionEvaluator } from "./evaluator";
import { StringValueOperator, StringValueOperators } from "./operators";

export const propertyEvaluator: ConditionEvaluator = {
  type: CONDITION_PROPERTY,
  label: "Property",
  operators: StringValueOperators,
  fields: [
    {
      key: "property",
      label: "Property",
      description: "The frontmatter property name to check",
      placeholder: "tag",
      fieldType: "text",
    },
  ],
  evaluate(file: TFile, data: ConditionData, app: App): boolean {
    const op = new StringValueOperator(data.operator ?? "");
    const prop = data.params?.property;
    if (!prop) return false;
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter) return false;
    const propValue = getFrontMatterString(frontmatter, prop);
    return op.evaluate(propValue, data.params?.value);
  },
};
