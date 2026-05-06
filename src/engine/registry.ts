import type { ActionExecutor } from "./actions/executor";
import type { ConditionEvaluator } from "./conditions/evaluator";

export class HandlerRegistry {
  private conditions = new Map<string, ConditionEvaluator>();
  private actions = new Map<string, ActionExecutor>();

  registerCondition(handler: ConditionEvaluator): void {
    this.conditions.set(handler.type, handler);
  }

  registerAction(handler: ActionExecutor): void {
    this.actions.set(handler.type, handler);
  }

  getCondition(type: string): ConditionEvaluator | undefined {
    return this.conditions.get(type);
  }

  getAction(type: string): ActionExecutor | undefined {
    return this.actions.get(type);
  }

  allConditions(): ConditionEvaluator[] {
    return Array.from(this.conditions.values());
  }

  allActions(): ActionExecutor[] {
    return Array.from(this.actions.values());
  }
}
