import type { MonitoredFolderData, Rule } from "../types";

type RenderCallback = (rules: Rule[]) => void;

export class MonitoredFolder {
  private renderCallbacks: Set<RenderCallback> = new Set();

  constructor(
    public path: string,
    private _rules: Rule[] = [],
  ) {}

  public get rules() {
    return this._rules;
  }

  /*
const self = this;
    this._foldersProxy = new Proxy(this._monitoredFolders, {
      get(target, property, receiver) {
        if (property === 'push') {
          return (...args: MonitoredFolder[]) => {
						const result = Array.prototype.push.apply(target, args);
            self._callbacks.forEach((cb) => {
              cb(target);
            });
            return result;
          };
        } else if (property === 'remove') {
					return (arg: MonitoredFolder) => {
						const result = Array.prototype.remove.apply(target, [arg]);
						self._callbacks.forEach((cb) => {
              cb(target);
            });
						return result;
					}
				}
        return Reflect.get(target, property, receiver);
      },
    });
    */

  addRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.add(callback);
  }

  removeRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.delete(callback);
  }

  findRule(id: string): Rule | undefined {
    return this._rules.filter((rule) => rule.id === id).first();
  }

  addRule(rule: Rule): void {
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

  modifyRule(newRule: Rule): void {
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
