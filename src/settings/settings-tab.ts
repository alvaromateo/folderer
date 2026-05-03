import {
  type App,
  Notice,
  PluginSettingTab,
  Setting,
  type TextComponent,
} from "obsidian";
import type FoldererPlugin from "../main";
import { FoldersContainer } from "./components/folders/container";
import { MonitoredFolder } from "./monitored-folder";

export class FoldererSettingTab extends PluginSettingTab {
  plugin: FoldererPlugin;
  foldersContainer: FoldersContainer;

  constructor(app: App, plugin: FoldererPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Called at application start and every time the user goes into
   * the plugin settings tab.
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Monitored Folders" });
    containerEl.createEl("p", {
      text: `Add folders for which you want to automate actions. 
				Each folder can have multiple rules configured.`,
      cls: "setting-item-description",
    });

    this.renderAddFolderRow(containerEl);

    this.foldersContainer = new FoldersContainer(
      this.plugin,
      containerEl.createDiv("folderer_folders"),
    );
    this.foldersContainer.render(this.plugin.settings.monitoredFolders);
  }

  private async addFolderEvent(addInput: TextComponent) {
    await this.addFolder(addInput.getValue().trim());
    addInput.setValue("");
  }

  private renderAddFolderRow(containerEl: HTMLElement): void {
    let addInput: TextComponent;
    new Setting(containerEl)
      .setName("Add folder")
      .addText((text) => {
        addInput = text;
        text.setPlaceholder("Folder name");
        text.inputEl.addEventListener("keydown", async (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            await this.addFolderEvent(addInput);
          }
        });
      })
      .addButton((btn) =>
        btn
          .setButtonText("Add")
          .setCta()
          .onClick(async () => {
            await this.addFolderEvent(addInput);
          }),
      );
  }

  private async addFolder(path: string): Promise<void> {
    if (!path) return;
    if (this.plugin.settings.findFolder(path)) {
      new Notice(`"${path}" is already monitored.`);
      return;
    }
    this.plugin.settings.addFolder(new MonitoredFolder(path));
    await this.plugin.saveSettings();
  }
}
