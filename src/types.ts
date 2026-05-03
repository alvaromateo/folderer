export type TriggerType = "create" | "rename" | "delete";

export interface Trigger {
  type: TriggerType;
}

export type ConditionType = "filename-matches";

export interface Condition {
  type: ConditionType;
  value: string;
}
// Name
// Property
// Path

export type ActionType = "append-text" | "prepend-text";
// Move attachments
// Insert template
// Modify properties

export interface Action {
  type: ActionType;
  value: string;
}

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  condition?: Condition;
  action: Action;
}

export interface MonitoredFolderData {
  path: string;
  rules: Rule[];
}

export interface FoldererSettingsData {
  monitoredFolders: MonitoredFolderData[];
}
