import { Plugin, TFile } from "obsidian";
import { getMatchingFolder, isCrossfolderMove } from "./handlers";
import { MonitoredFolder } from "./settings/monitored-folder";
import { FoldererSettings } from "./settings/settings";
import { FoldererSettingTab } from "./settings/settings-tab";
import type { FoldererSettingsData, Rule, TriggerType } from "./settings/types";

export default class FoldererPlugin extends Plugin {
  settings!: FoldererSettings;

  async onload() {
    this.settings = await this.loadSettings();

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
          await this.runRules(abstractFile, folder, "create");
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
        await this.runRules(abstractFile, folder, triggerType);
      }),
    );
  }

  private async runRules(
    file: TFile,
    folder: MonitoredFolder,
    triggerType: TriggerType,
  ): Promise<void> {
    const filename = file.name;
    for (const rule of folder.rules) {
      if (!rule.enabled) continue;
      if (rule.trigger.type !== triggerType) continue;
      if (rule.condition) {
        try {
          if (!new RegExp(rule.condition.value).test(filename)) continue;
        } catch {
          console.warn(
            `Folderer: invalid regex in rule "${rule.name}": ${rule.condition.value}`,
          );
          continue;
        }
      }
      await this.executeAction(file, rule);
    }
  }

  private async executeAction(file: TFile, rule: Rule): Promise<void> {
    try {
      await this.app.vault.process(file, (content) => {
        if (rule.action.type === "append-text")
          return `${content}\n${rule.action.value}`;
        if (rule.action.type === "prepend-text")
          return `${rule.action.value}\n${content}`;
        return content;
      });
    } catch (err) {
      console.error(
        `Folderer: action failed for rule "${rule.name}" on ${file.path}`,
        err,
      );
    }
  }

  async loadSettings(): Promise<FoldererSettings> {
    const raw = (await this.loadData()) as FoldererSettingsData | null;
    if (!raw) return new FoldererSettings();
    const folders = (raw.monitoredFolders ?? []).map((entry) =>
      MonitoredFolder.fromJSON(entry),
    );
    return new FoldererSettings(folders);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings.toJSON());
  }
}
