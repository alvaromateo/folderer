import type { Action, Trigger } from "../types";
import type { Condition } from "../engine/conditions/condition";

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  condition?: Condition;
  action: Action;
}
