import type { TFile } from "obsidian";
import type { ConditionData } from "../../types";
import { CONDITION_NONE } from "../../constants";

export abstract class Condition implements ConditionData {
  static type: string;

  constructor(
    public type: string,
    public conditions: Condition[] = [],
  ) {}

  public abstract evaluate(file: TFile): boolean;
}

export class All extends Condition {
  public evaluate(file: TFile): boolean {
    let result = true;
    for (const condition of this.conditions) {
      result = result && condition.evaluate(file);
    }
    return result;
  }
}

export class Any extends Condition {
  public evaluate(file: TFile): boolean {
    let result = false;
    for (const condition of this.conditions) {
      result = result || condition.evaluate(file);
    }
    return result;
  }
}

export class None extends Condition {
  public evaluate(file: TFile): boolean {
    let result = false;
    for (const condition of this.conditions) {
      result = result || condition.evaluate(file);
    }
    return !result;
  }
}

export abstract class SingleCondition extends Condition {
  constructor(
    public type: string,
    public operator: string,
    public params: Record<string, string>,
  ) {
    super(type, []);
  }
}

export class NoneCondition extends SingleCondition {
  static type: string = "none";
  static label: string = "None";
  
  constructor() {
    super(CONDITION_NONE, "", {});
  }

  public evaluate(): boolean {
    return true;
  }
}
