import { Modal, Notice, Setting } from "obsidian";
import type FoldererPlugin from "../../../main";
import type {
  Action,
  ActionType,
  Condition,
  ConditionType,
  Rule,
  Trigger,
  TriggerType,
} from "../../../types";
import type { MonitoredFolder } from "../../monitored-folder";

export class RuleModal extends Modal {
  private rule: Rule;
  private isNew: boolean;

  constructor(
    private plugin: FoldererPlugin,
    private monitoredFolder: MonitoredFolder,
    selectedRule: Rule | null,
    private onSave: () => void,
  ) {
    super(plugin.app);
    this.isNew = selectedRule === null;

    if (selectedRule === null) {
      this.rule = {
        id: crypto.randomUUID(),
        name: "",
        enabled: true,
        trigger: { type: "create" } as Trigger,
        action: { type: "append-text", value: "" } as Action,
      };
    } else {
      this.rule = selectedRule;
    }
  }

  onOpen(): void {
    const { contentEl } = this;
    this.setTitle(this.isNew ? "Add rule" : "Edit rule");
    contentEl.empty();

    new Setting(contentEl).setName("Rule name").addText((text) =>
      text
        .setPlaceholder("My rule")
        .setValue(this.rule.name)
        .onChange((v) => {
          this.rule.name = v;
        }),
    );

    new Setting(contentEl).setName("Enabled").addToggle((toggle) =>
      toggle.setValue(this.rule.enabled).onChange((v) => {
        this.rule.enabled = v;
      }),
    );

    new Setting(contentEl)
      .setName("Trigger")
      .setDesc("Which vault event fires this rule")
      .addDropdown((dd) =>
        dd
          .addOption("create", "File created")
          .addOption("rename", "File renamed / moved")
          .addOption("delete", "File deleted")
          .setValue(this.rule.trigger.type)
          .onChange((v) => {
            this.rule.trigger.type = v as TriggerType;
          }),
      );

    const conditionValueSetting = new Setting(contentEl)
      .setName("Condition value")
      .setDesc("Regex pattern matched against the filename (without path)")
      .addText((text) =>
        text
          .setPlaceholder("rule-.*\\.md")
          .setValue(this.rule.condition?.value ?? "")
          .onChange((v) => {
            if (this.rule.condition) this.rule.condition.value = v;
          }),
      );

    const showConditionValue = (show: boolean) => {
      conditionValueSetting.settingEl.style.display = show ? "" : "none";
    };
    showConditionValue(!!this.rule.condition);

    new Setting(contentEl)
      .setName("Condition")
      .setDesc("Optional filter — leave as None to always run the action")
      .addDropdown((dd) => {
        dd.addOption("none", "None")
          .addOption("filename-matches", "Filename matches pattern")
          .setValue(this.rule.condition?.type ?? "none")
          .onChange((v) => {
            if (v === "none") {
              delete this.rule.condition;
              showConditionValue(false);
            } else {
              this.rule.condition = {
                type: v as ConditionType,
                value: this.rule.condition?.value ?? "",
              } as Condition;
              showConditionValue(true);
            }
          });
      });

    // Move conditionValueSetting below the condition dropdown in the DOM
    contentEl.appendChild(conditionValueSetting.settingEl);

    new Setting(contentEl).setName("Action").addDropdown((dd) =>
      dd
        .addOption("append-text", "Append text to file")
        .addOption("prepend-text", "Prepend text to file")
        .setValue(this.rule.action.type)
        .onChange((v) => {
          this.rule.action.type = v as ActionType;
        }),
    );

    new Setting(contentEl)
      .setName("Text")
      .setDesc("Text to add to the file")
      .addText((text) =>
        text
          .setPlaceholder("folderer")
          .setValue(this.rule.action.value)
          .onChange((v) => {
            this.rule.action.value = v;
          }),
      );

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText(this.isNew ? "Add" : "Save")
          .setCta()
          .onClick(async () => {
            await this.save();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
        }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async save(): Promise<void> {
    if (!this.rule.name.trim()) {
      new Notice("Rule name cannot be empty.");
      return;
    }
    if (!this.rule.action.value.trim()) {
      new Notice("Action text cannot be empty.");
      return;
    }

    if (this.isNew) {
      this.monitoredFolder.addRule(this.rule);
    } else {
      // onSave must be called first, otherwise the rule modifications
      // are not properly marked and re-rendered
      this.onSave();
      this.monitoredFolder.modifyRule(this.rule);
    }
    await this.plugin.saveSettings();
    this.close();
  }
}
