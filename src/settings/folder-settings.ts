import type { MonitoredFolderData, RuleData } from "../types";

type RenderCallback = (rules: RuleData[]) => void;

export class MonitoredFolder {
  private renderCallbacks: Set<RenderCallback> = new Set();

  constructor(
    public path: string,
    private _rules: RuleData[] = [],
  ) {}

  public get rules() {
    return this._rules;
  }

  addRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.add(callback);
  }

  removeRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    const snapshot = [...this._rules];
    for (const cb of this.renderCallbacks) {
      cb(snapshot);
    }
  }

  findRule(id: string): RuleData | undefined {
    return this._rules.filter((rule) => rule.id === id).first();
  }

  addRule(rule: RuleData): void {
    this._rules.push(rule);
    this.notifyCallbacks();
  }

  removeRule(id: string): void {
    const index = this._rules.findIndex((rule) => rule.id === id);
    if (index >= 0) {
      this._rules.splice(index, 1);
      this.notifyCallbacks();
    }
  }

  moveRule(id: string, direction: "up" | "down"): boolean {
    const index = this._rules.findIndex((rule) => rule.id === id);
    if (index < 0) return false;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= this._rules.length) return false;

    const a = this._rules[index] as RuleData;
    const b = this._rules[swapIndex] as RuleData;
    this._rules[index] = b;
    this._rules[swapIndex] = a;
    this.notifyCallbacks();
    return true;
  }

  modifyRule(newRule: RuleData): void {
    const index = this._rules.findIndex((rule) => rule.id === newRule.id);
    if (index >= 0) {
      this._rules[index] = newRule;
      this.notifyCallbacks();
    } else {
      console.error(`Can't modify an unexisting rule (id: ${newRule.id})`);
    }
  }

  toJSON(): MonitoredFolderData {
    return { path: this.path, rules: this._rules };
  }

  static fromJSON(data: MonitoredFolderData): MonitoredFolder {
    return new MonitoredFolder(data.path, data.rules);
  }
}
