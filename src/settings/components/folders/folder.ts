import { Setting } from "obsidian";
import type FoldererPlugin from "../../../main";
import { RulesContainer } from "../rules/container";
import { RuleModal } from "../rules/rule-modal";

export class Folder {
  constructor(
    public plugin: FoldererPlugin,
    public folderPath: string,
    public element: HTMLDivElement,
  ) {}

  render(): void {
    this.element.empty();
    const folder = this.plugin.settings.findFolder(this.folderPath);
    if (!folder) {
      console.warn(`Folder "${this.folderPath} to be rendered does not exist.`);
      return;
    }

    new Setting(this.element)
      .setName(folder.path)
      .setHeading()
      .addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Remove folder")
          .onClick(async () => {
            this.plugin.settings.removeFolder(folder.path);
            await this.plugin.saveSettings();
          }),
      );

    const rulesEl = this.element.createDiv("folderer_rules");
    const rulesContainer = new RulesContainer(this.plugin, folder, rulesEl);
    rulesContainer.render(folder.rules);

    new Setting(this.element).addButton((btn) =>
      btn.setButtonText("Add rule").onClick(() => {
        new RuleModal(this.plugin, folder, null, () => this.render()).open();
      }),
    );
  }
}
