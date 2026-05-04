import type { TFile } from "obsidian";
import { CONDITION_FILE_PATH } from "../../constants";
import { SingleCondition } from "./condition";
import { StringValueOperator } from "./operators";

export class FilePathCondition extends SingleCondition {
  static type: string = "file-path";
  static label: string = "File path";

  constructor(operator: string, params: Record<string, string>) {
    super(CONDITION_FILE_PATH, operator, params);
  }

  public evaluate(file: TFile): boolean {
    const op = new StringValueOperator(this.operator);
    const value = this.params.value;
    return op.evaluate(file.path, value);
  }
}
