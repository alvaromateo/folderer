import type { TFile } from "obsidian";
import { CONDITION_PROPERTY } from "../../constants";
import { SingleCondition } from "./condition";
import { StringValueOperator } from "./operators";
import { getRuleEngine } from "../rule-engine";
import { getFrontMatterString } from "../utils";

export class FilePathCondition extends SingleCondition {
  static type: string = "property";
  static label: string = "Property";

  constructor(operator: string, params: Record<string, string>) {
    super(CONDITION_PROPERTY, operator, params);
  }

  public evaluate(file: TFile): boolean {
    const op = new StringValueOperator(this.operator);
    const prop = this.params.property;
    if (prop === undefined) {
      return false;
    }

    const app = getRuleEngine()?.app;
    const frontmatter = app?.metadataCache.getFileCache(file)?.frontmatter;
    if (frontmatter === undefined) {
      return false;
    }

    const propValue = getFrontMatterString(frontmatter, prop);
    const value = this.params.value;
    return op.evaluate(propValue, value);
  }
}
