import { Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, type FoldererSettings } from "./settings";
import { FoldererSettingTab } from "./settings-tab";
import { isCrossfolderMove, isInMonitoredFolder } from "./handlers";

export default class FoldererPlugin extends Plugin {
	settings: FoldererSettings | undefined;

	async onload() {
		this.settings = await this.loadSettings();
		if (!this.settings) {
			console.error("Folderer: plugin settings could not be loaded");
			return;
		}

		this.addSettingTab(new FoldererSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("create", async (abstractFile) => {
				if (!(abstractFile instanceof TFile)) return;
				if (abstractFile.extension !== "md") return;
				if (
					!isInMonitoredFolder(
						abstractFile.path,
						this.settings?.monitoredFolders || [],
					)
				)
					return;

				await this.appendText(abstractFile);
			}),
		);

		this.registerEvent(
			this.app.vault.on("rename", async (abstractFile, oldPath) => {
				if (!(abstractFile instanceof TFile)) return;
				if (abstractFile.extension !== "md") return;

				if (!isCrossfolderMove(abstractFile.path, oldPath)) return;

				if (
					!isInMonitoredFolder(
						abstractFile.path,
						this.settings?.monitoredFolders || [],
					)
				)
					return;

				await this.appendText(abstractFile);
			}),
		);
	}

	private async appendText(file: TFile): Promise<void> {
		const textToAppend =
			this.settings?.appendText || DEFAULT_SETTINGS.appendText;
		try {
			await this.app.vault.process(file, (content) => {
				return `${content}\n${textToAppend}`;
			});
		} catch (err) {
			console.error(`Folderer: failed to append to ${file.path}`, err);
		}
	}

	async loadSettings() {
		return Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
