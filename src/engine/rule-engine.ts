import type { App, TFile } from "obsidian";
import type { MonitoredFolder } from "../settings/folder-settings";
import type { TriggerType } from "../types";
import { HandlerRegistry } from "./registry";
import { appendTextAction } from "./actions/append-text";
import { prependTextAction } from "./actions/prepend-text";
import { FileNameCondition } from "./conditions/file-name";
import type { Rule } from "../model/rule";

export class RuleEngine {
  constructor(
    public readonly registry: HandlerRegistry,
    public readonly app: App,
  ) {}

  async runRules(
    file: TFile,
    folder: MonitoredFolder,
    triggerType: TriggerType,
  ): Promise<void> {
    for (const rule of folder.rules) {
      if (!rule.enabled) continue;
      if (rule.trigger.type !== triggerType) continue;
      if (!(await this.conditionPasses(file, rule))) continue;
      await this.executeAction(file, rule);
    }
  }

  private async conditionPasses(file: TFile, rule: Rule): Promise<boolean> {
    if (!rule.condition) return true;
    const ConditionCls = this.registry.getCondition(rule.condition.type);
    if (!ConditionCls) {
      console.warn(
        `Folderer: unknown condition type "${rule.condition.type}" in rule "${rule.name}"`,
      );
      return false;
    }
    try {
      const handler = new ConditionCls(rule.condition)
      return handler.evaluate(file, rule.condition);
    } catch (err) {
      console.warn(
        `Folderer: condition evaluation failed for rule "${rule.name}"`,
        err,
      );
      return false;
    }
  }

  private async executeAction(file: TFile, rule: Rule): Promise<void> {
    const handler = this.registry.getAction(rule.action.type);
    if (!handler) {
      console.warn(
        `Folderer: unknown action type "${rule.action.type}" in rule "${rule.name}"`,
      );
      return;
    }
    try {
      await handler.execute(file, rule.action, this.app);
    } catch (err) {
      console.error(
        `Folderer: action failed for rule "${rule.name}" on ${file.path}`,
        err,
      );
    }
  }
}

let _ruleEngine: RuleEngine | undefined;

export const getRuleEngine = () => {
  return _ruleEngine;
}

export const createRuleEngine = (app: App): RuleEngine => {
  const registry = new HandlerRegistry();
  // conditions
  registry.registerCondition(new FileNameCondition());
  // actions
  registry.registerAction(appendTextAction);
  registry.registerAction(prependTextAction);
  _ruleEngine = new RuleEngine(registry, app);
  return _ruleEngine;
}
