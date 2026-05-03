import { Setting } from "obsidian";
import type FoldererPlugin from "../../../main";
import type { MonitoredFolder } from "../../monitored-folder";
import type { Rule } from "../../types";
import { RuleModal } from "./rule-modal";

export class RuleRow {
  private _isModified: boolean = false;

  constructor(
    public plugin: FoldererPlugin,
    public monitoredFolder: MonitoredFolder,
    public element: HTMLDivElement,
    public ruleId: string,
  ) {}

  render(): void {
    const rule = this.monitoredFolder.rules
      .filter((rule) => rule.id === this.ruleId)
      .first();

    if (!rule) {
      console.warn(`Rule "${this.ruleId} to be rendered does not exist.`);
      return;
    }

    this.element.empty();
    new Setting(this.element)
      .setName(rule.name || "Unnamed")
      .setDesc(this.buildDescription(rule))
      .addToggle((toggle) =>
        toggle.setValue(rule.enabled).onChange(async (value) => {
          rule.enabled = value;
          await this.plugin.saveSettings();
        }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("pencil")
          .setTooltip("Edit rule")
          .onClick(() => {
            new RuleModal(
              this.plugin,
              this.monitoredFolder,
              rule,
              this.setModified.bind(this),
            ).open();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Delete rule")
          .onClick(async () => {
            this.monitoredFolder.removeRule(rule.id);
            await this.plugin.saveSettings();
          }),
      );

    // reset isModified, as we just rendered the latest changes
    this._isModified = false;
  }

  private setModified(): void {
    this._isModified = true;
  }

  public get isModified(): boolean {
    return this._isModified;
  }

  private buildDescription(rule: Rule): string {
    const parts: string[] = [`on ${rule.trigger.type}`];
    if (rule.condition) {
      parts.push(`if filename matches "${rule.condition.value}"`);
    }
    parts.push(`→ ${rule.action.type} "${rule.action.value}"`);
    return parts.join(" ");
  }
}
