import type { ActionHandler } from "./action-handler";
import type { ConditionHandler } from "./condition-handler";

export class HandlerRegistry {
  private conditions = new Map<string, ConditionHandler>();
  private actions = new Map<string, ActionHandler>();

  registerCondition(handler: ConditionHandler): void {
    this.conditions.set(handler.type, handler);
  }

  registerAction(handler: ActionHandler): void {
    this.actions.set(handler.type, handler);
  }

  getCondition(type: string): ConditionHandler | undefined {
    return this.conditions.get(type);
  }

  getAction(type: string): ActionHandler | undefined {
    return this.actions.get(type);
  }

  allConditions(): ConditionHandler[] {
    return Array.from(this.conditions.values());
  }

  allActions(): ActionHandler[] {
    return Array.from(this.actions.values());
  }
}
