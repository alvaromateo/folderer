import type { MonitoredFolderData, RuleData } from "../types";

type RenderCallback = (rules: RuleData[]) => void;

export class MonitoredFolderSettings {
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

  findRule(id: string): RuleData | undefined {
    return this._rules.filter((rule) => rule.id === id).first();
  }

  addRule(rule: RuleData): void {
    this._rules.push(rule);
    this.renderCallbacks.forEach((cb) => {
      cb(this._rules);
    });
  }

  removeRule(id: string): void {
    const rule = this.findRule(id);
    if (rule) {
      this._rules.remove(rule);
      this.renderCallbacks.forEach((cb) => {
        cb(this._rules);
      });
    }
  }

  modifyRule(newRule: RuleData): void {
    const rule = this.findRule(newRule.id);
    if (rule) {
      const index = this._rules.indexOf(rule);
      if (index >= 0) {
        this._rules[index] = newRule;
      }
      this.renderCallbacks.forEach((cb) => {
        cb(this._rules);
      });
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
