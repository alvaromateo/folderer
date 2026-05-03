import { Plugin, TFile } from "obsidian";
import { appendTextAction } from "./engine/actions/append-text";
import { prependTextAction } from "./engine/actions/prepend-text";
import { filenameMatchesCondition } from "./engine/conditions/filename-matches";
import { HandlerRegistry } from "./engine/registry";
import { RuleEngine } from "./engine/rule-engine";
import { getMatchingFolder, isCrossfolderMove } from "./handlers";
import { MonitoredFolder } from "./settings/monitored-folder";
import { FoldererSettings } from "./settings/settings";
import { FoldererSettingTab } from "./settings/settings-tab";
import type {
  FoldererSettingsData,
  MonitoredFolderData,
  Rule,
  TriggerType,
} from "./types";

export default class FoldererPlugin extends Plugin {
  settings!: FoldererSettings;
  engine!: RuleEngine;

  async onload() {
    this.settings = await this.loadSettings();
    this.engine = this.createEngine();

    this.addSettingTab(new FoldererSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(
        this.app.vault.on("create", async (abstractFile) => {
          if (!(abstractFile instanceof TFile)) return;
          if (abstractFile.extension !== "md") return;
          const folder = getMatchingFolder(
            abstractFile.path,
            this.settings.monitoredFolders,
          );
          if (!folder) return;
          await this.engine.runRules(abstractFile, folder, "create");
        }),
      );
    });

    this.registerEvent(
      this.app.vault.on("rename", async (abstractFile, oldPath) => {
        if (!(abstractFile instanceof TFile)) return;
        if (abstractFile.extension !== "md") return;
        const folder = getMatchingFolder(
          abstractFile.path,
          this.settings.monitoredFolders,
        );
        if (!folder) return;
        const triggerType: TriggerType = isCrossfolderMove(
          abstractFile.path,
          oldPath,
        )
          ? "create"
          : "rename";
        await this.engine.runRules(abstractFile, folder, triggerType);
      }),
    );
  }

  private createEngine(): RuleEngine {
    const registry = new HandlerRegistry();
    registry.registerCondition(filenameMatchesCondition);
    registry.registerAction(appendTextAction);
    registry.registerAction(prependTextAction);
    return new RuleEngine(registry, this.app);
  }

  async loadSettings(): Promise<FoldererSettings> {
    const raw = (await this.loadData()) as unknown;
    if (!raw) return new FoldererSettings();
    const migrated = migrateRawData(raw);
    const folders = migrated.monitoredFolders.map((entry) =>
      MonitoredFolder.fromJSON(entry),
    );
    return new FoldererSettings(folders);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings.toJSON());
  }
}

function migrateRawData(raw: unknown): FoldererSettingsData {
  if (!isObject(raw)) return { monitoredFolders: [] };
  const rawFolders = Array.isArray(
    (raw as Record<string, unknown>).monitoredFolders,
  )
    ? ((raw as Record<string, unknown>).monitoredFolders as unknown[])
    : [];
  return {
    monitoredFolders: rawFolders.map(migrateFolder),
  };
}

function migrateFolder(f: unknown): MonitoredFolderData {
  if (!isObject(f)) return { path: "", rules: [] };
  const obj = f as Record<string, unknown>;
  return {
    path: typeof obj.path === "string" ? obj.path : "",
    rules: Array.isArray(obj.rules) ? obj.rules.map(migrateRule) : [],
  };
}

function migrateRule(r: unknown): Rule {
  if (!isObject(r)) {
    return {
      id: crypto.randomUUID(),
      name: "",
      enabled: false,
      trigger: { type: "create" },
      action: { type: "append-text", params: {} },
    };
  }
  const obj = r as Record<string, unknown>;
  return {
    id: typeof obj.id === "string" ? obj.id : crypto.randomUUID(),
    name: typeof obj.name === "string" ? obj.name : "",
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : true,
    trigger:
      isObject(obj.trigger) &&
      typeof (obj.trigger as Record<string, unknown>).type === "string"
        ? { type: (obj.trigger as Record<string, unknown>).type as TriggerType }
        : { type: "create" },
    condition:
      obj.condition != null ? migrateCondition(obj.condition) : undefined,
    action: migrateAction(obj.action),
  };
}

function migrateCondition(c: unknown): Rule["condition"] {
  if (!isObject(c)) return undefined;
  const obj = c as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type : "filename-matches";
  // migrate old { type, value } shape → { type, params: { pattern: value } }
  if (typeof obj.value === "string" && !isObject(obj.params)) {
    return {
      type: type as Rule["condition"] extends { type: infer T } ? T : never,
      params: { pattern: obj.value },
    };
  }
  return {
    type: type as Rule["condition"] extends { type: infer T } ? T : never,
    params: isObject(obj.params) ? (obj.params as Record<string, string>) : {},
  };
}

function migrateAction(a: unknown): Rule["action"] {
  if (!isObject(a)) return { type: "append-text", params: {} };
  const obj = a as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type : "append-text";
  // migrate old { type, value } shape → { type, params: { text: value } }
  if (typeof obj.value === "string" && !isObject(obj.params)) {
    return {
      type: type as Rule["action"]["type"],
      params: { text: obj.value },
    };
  }
  return {
    type: type as Rule["action"]["type"],
    params: isObject(obj.params) ? (obj.params as Record<string, string>) : {},
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
