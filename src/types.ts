export type TriggerType = "create" | "rename" | "delete";

export interface Trigger {
  type: TriggerType;
}

export interface ConditionData {
  type: string;
  operator?: string;
  params?: Record<string, string>;
  conditions?: ConditionData[];
}

export interface RootConditionData extends ConditionData {
  type: "all" | "any" | "none";
  conditions: ConditionData[];
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
  conditions?: RootConditionData;
  actions: ActionData[];
}

export interface FoldererSettingsData {
  monitoredFolders: MonitoredFolderData[];
}

export interface MonitoredFolderData {
  path: string;
  rules: RuleData[];
}
