import type { App, TFile } from "obsidian";
import type { MonitoredFolder } from "../settings/monitored-folder";
import type { Rule, TriggerType } from "../types";
import type { HandlerRegistry } from "./registry";

export class RuleEngine {
  constructor(
    public readonly registry: HandlerRegistry,
    private app: App,
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
    const handler = this.registry.getCondition(rule.condition.type);
    if (!handler) {
      console.warn(
        `Folderer: unknown condition type "${rule.condition.type}" in rule "${rule.name}"`,
      );
      return false;
    }
    try {
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
