import type {
  ACTION_APPEND,
  ACTION_INSERT_TEMPLATE,
  ACTION_MODIFY_PROPERTY,
  ACTION_MOVE_ATTACHMENTS,
  ACTION_PREPEND,
} from "./constants";

export type TriggerType = "create" | "rename" | "delete";

export interface Trigger {
  type: TriggerType;
}

export type ConditionType = "filename-matches";

export interface Condition {
  type: ConditionType;
  params: Record<string, string>;
}

export type ActionType =
  | typeof ACTION_APPEND
  | typeof ACTION_PREPEND
  | typeof ACTION_MOVE_ATTACHMENTS
  | typeof ACTION_INSERT_TEMPLATE
  | typeof ACTION_MODIFY_PROPERTY;

export interface Action {
  type: ActionType;
  params: Record<string, string>;
}

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  condition?: Condition;
  action: Action;
}

/**
 * DTO interfaces
 */

export interface FoldererSettingsData {
  monitoredFolders: MonitoredFolderData[];
}

export interface MonitoredFolderData {
  path: string;
  rules: RuleData[];
}

export interface ConditionData {
  type: string;
  conditions: ConditionData[];
  operator?: string;
  params?: Record<string, string>;
}

export interface ActionData {
  type: string;
  params: Record<string, string>;
}

export interface RuleData {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  conditions?: ConditionData[];
  actions?: ActionData[];
}
