import {
	type App,
	Notice,
	PluginSettingTab,
	Setting,
	type TextComponent,
} from "obsidian";
import type FoldererPlugin from "./main";

export class FoldererSettingTab extends PluginSettingTab {
	plugin: FoldererPlugin;

	constructor(app: App, plugin: FoldererPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Text to append")
			.setDesc(
				"Text appended to the end of each file when it enters a monitored folder.",
			)
			.addText((text) =>
				text
					.setPlaceholder("folderer")
					.setValue(this.plugin.settings?.appendText || "")
					.onChange(async (value) => {
						if (this.plugin.settings) {
							this.plugin.settings.appendText = value;
							await this.plugin.saveSettings();
						}
					}),
			);

		containerEl.createEl("h3", { text: "Monitored Folders" });
		containerEl.createEl("p", {
			text: 'Enter vault-relative folder paths (e.g. "Literature" or "Projects/Active"). One path per entry.',
			cls: "setting-item-description",
		});

		const folderListEl = containerEl.createDiv("folderer-folder-list");
		this.renderFolderList(folderListEl);

		let addInput: TextComponent;
		new Setting(containerEl)
			.setName("Add folder")
			.addText((text) => {
				addInput = text;
				text.setPlaceholder("Literature");
				text.inputEl.addEventListener("keydown", async (e: KeyboardEvent) => {
					if (e.key === "Enter")
						await this.addFolder(addInput.getValue().trim(), folderListEl);
				});
			})
			.addButton((btn) =>
				btn
					.setButtonText("Add")
					.setCta()
					.onClick(async () => {
						await this.addFolder(addInput.getValue().trim(), folderListEl);
						addInput.setValue("");
					}),
			);
	}

	private renderFolderList(containerEl: HTMLElement): void {
		containerEl.empty();
		for (const folder of (this.plugin.settings?.monitoredFolders || [])) {
			new Setting(containerEl).setName(folder).addButton((btn) =>
				btn
					.setIcon("trash")
					.setTooltip("Remove")
					.onClick(async () => {
						if (this.plugin.settings) {
							this.plugin.settings.monitoredFolders =
								this.plugin.settings.monitoredFolders.filter((f) => f !== folder);
							await this.plugin.saveSettings();
						}
						this.renderFolderList(containerEl);
					}),
			);
		}
	}

	private async addFolder(folder: string, listEl: HTMLElement): Promise<void> {
		if (!folder) return;
		if (this.plugin.settings?.monitoredFolders.includes(folder)) {
			new Notice(`"${folder}" is already monitored.`);
			return;
		}
		this.plugin.settings?.monitoredFolders.push(folder);
		await this.plugin.saveSettings();
		this.renderFolderList(listEl);
	}
}
