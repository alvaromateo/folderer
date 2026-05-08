import { Plugin, TFile } from "obsidian";
import { createRuleEngine, type RuleEngine } from "./engine/rule-engine";
import { getMatchingFolder, isCrossfolderMove } from "./handlers";
// import { migrateRawData } from "./migration";
// import { MonitoredFolder } from "./settings/folder-settings";
import { FoldererSettings } from "./settings/settings";
import { FoldererSettingTab } from "./settings/settings-tab";
import type { FoldererSettingsData, TriggerType } from "./types";

export default class FoldererPlugin extends Plugin {
  settings!: FoldererSettings;
  engine!: RuleEngine;

  async onload() {
    this.settings = await this.loadSettings();
    this.engine = createRuleEngine(this.app);

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
    });
  }

  async loadSettings(): Promise<FoldererSettings> {
    const raw = (await this.loadData()) as unknown;
    if (!raw) return new FoldererSettings();
    return FoldererSettings.fromJSON(raw as FoldererSettingsData);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings.toJSON());
  }
}
