import { type App, Notice, type TFile } from "obsidian";
import type { MonitoredFolder } from "../settings/folder-settings";
import type { ActionData, ConditionData, TriggerType } from "../types";
import { appendTextExecutor } from "./actions/append-text";
import {
  moveToDateSubfolderExecutor,
  moveToPropertySubfolderExecutor,
} from "./actions/move-to-subfolder";
import { prependTextExecutor } from "./actions/prepend-text";
import { fileNameEvaluator } from "./conditions/file-name";
import { filePathEvaluator } from "./conditions/file-path";
import { propertyEvaluator } from "./conditions/property";
import { HandlerRegistry } from "./registry";

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
      if (rule.conditions) {
        const testConditions = this.evaluateCondition(rule.conditions, file);
        if (!testConditions) continue;
      }
      for (const action of rule.actions) {
        await this.executeAction(file, action, rule.name);
      }
    }
  }

  private evaluateCondition(data: ConditionData, file: TFile): boolean {
    if (data.type === "all") {
      return (data.conditions ?? []).every((c) =>
        this.evaluateCondition(c, file),
      );
    }
    if (data.type === "any") {
      return (data.conditions ?? []).some((c) =>
        this.evaluateCondition(c, file),
      );
    }
    if (data.type === "none") {
      return !(data.conditions ?? []).some((c) =>
        this.evaluateCondition(c, file),
      );
    }

    const evaluator = this.registry.getCondition(data.type);
    if (!evaluator) {
      console.warn(`Folderer: unknown condition type "${data.type}"`);
      return false;
    }
    try {
      return evaluator.evaluate(file, data, this.app);
    } catch (err) {
      console.error("Folderer: condition evaluation error", err);
      new Notice(`Condition evaluation error. Check DevTools for details.`);
      return false;
    }
  }

  private async executeAction(
    file: TFile,
    data: ActionData,
    ruleName: string,
  ): Promise<void> {
    const executor = this.registry.getAction(data.type);
    if (!executor) {
      console.warn(
        `Folderer: unknown action type "${data.type}" in rule "${ruleName}"`,
      );
      return;
    }
    try {
      await executor.execute(file, data, this.app);
    } catch (err) {
      console.error(
        `Folderer: action failed for rule "${ruleName}" on ${file.path}`,
        err,
      );
      new Notice(
        `Action execution error in rule "${ruleName}". Check DevTools for details.`,
      );
    }
  }
}

let _ruleEngine: RuleEngine | undefined;

export const getRuleEngine = () => _ruleEngine;

export const createRuleEngine = (app: App): RuleEngine => {
  const registry = new HandlerRegistry();
  registry.registerCondition(fileNameEvaluator);
  registry.registerCondition(filePathEvaluator);
  registry.registerCondition(propertyEvaluator);
  registry.registerAction(appendTextExecutor);
  registry.registerAction(prependTextExecutor);
  registry.registerAction(moveToDateSubfolderExecutor);
  registry.registerAction(moveToPropertySubfolderExecutor);
  _ruleEngine = new RuleEngine(registry, app);
  return _ruleEngine;
};
