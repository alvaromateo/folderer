import type { ActionHandler } from "./action-handler";
import type { Condition } from "./conditions/condition";

export class HandlerRegistry {
  private conditions = new Map<string, typeof Condition>();
  private actions = new Map<string, ActionHandler>();

  registerCondition(handler: typeof Condition): void {
    this.conditions.set(handler.type, handler);
  }

  registerAction(handler: ActionHandler): void {
    this.actions.set(handler.type, handler);
  }

  getCondition(type: string): typeof Condition | undefined {
    return this.conditions.get(type);
  }

  getAction(type: string): ActionHandler | undefined {
    return this.actions.get(type);
  }

  allConditions(): typeof Condition[] {
    return Array.from(this.conditions.values());
  }

  allActions(): ActionHandler[] {
    return Array.from(this.actions.values());
  }
}
