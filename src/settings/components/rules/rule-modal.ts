import { Modal, Notice, Setting } from "obsidian";
import type { FieldDescriptor } from "../../../engine/field-descriptor";
import type FoldererPlugin from "../../../main";
import type {
  Action,
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
      const firstAction = plugin.engine.registry.allActions()[0];
      this.rule = {
        id: crypto.randomUUID(),
        name: "",
        enabled: true,
        trigger: { type: "create" } as Trigger,
        action: {
          type: (firstAction?.type ?? "append-text") as Action["type"],
          params: {},
        },
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

    // --- Condition section ---
    const conditionFieldsEl = contentEl.createDiv();

    new Setting(contentEl)
      .setName("Condition")
      .setDesc("Optional filter — leave as None to always run the action")
      .addDropdown((dd) => {
        dd.addOption("none", "None");
        for (const handler of this.plugin.engine.registry.allConditions()) {
          dd.addOption(handler.type, handler.label);
        }
        dd.setValue(this.rule.condition?.type ?? "none");
        dd.onChange((v) => {
          if (v === "none") {
            delete this.rule.condition;
          } else {
            this.rule.condition = {
              type: v as ConditionType,
              params: this.rule.condition?.params ?? {},
            };
          }
          this.renderFields(
            conditionFieldsEl,
            this.rule.condition
              ? (this.plugin.engine.registry.getCondition(v)?.fields ?? [])
              : [],
            this.rule.condition?.params ?? {},
          );
        });
      });

    // Move conditionFieldsEl below the condition dropdown in the DOM
    contentEl.appendChild(conditionFieldsEl);

    const initialConditionHandler = this.rule.condition
      ? this.plugin.engine.registry.getCondition(this.rule.condition.type)
      : undefined;
    this.renderFields(
      conditionFieldsEl,
      initialConditionHandler?.fields ?? [],
      this.rule.condition?.params ?? {},
    );

    // --- Action section ---
    const actionFieldsEl = contentEl.createDiv();

    new Setting(contentEl).setName("Action").addDropdown((dd) => {
      for (const handler of this.plugin.engine.registry.allActions()) {
        dd.addOption(handler.type, handler.label);
      }
      dd.setValue(this.rule.action.type);
      dd.onChange((v) => {
        this.rule.action = { type: v as Action["type"], params: {} };
        const handler = this.plugin.engine.registry.getAction(v);
        this.renderFields(
          actionFieldsEl,
          handler?.fields ?? [],
          this.rule.action.params,
        );
      });
    });

    // Move actionFieldsEl below the action dropdown in the DOM
    contentEl.appendChild(actionFieldsEl);

    const initialActionHandler = this.plugin.engine.registry.getAction(
      this.rule.action.type,
    );
    this.renderFields(
      actionFieldsEl,
      initialActionHandler?.fields ?? [],
      this.rule.action.params,
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

  private renderFields(
    container: HTMLElement,
    fields: FieldDescriptor[],
    params: Record<string, string>,
  ): void {
    container.empty();
    for (const field of fields) {
      const setting = new Setting(container).setName(field.label);
      if (field.description) setting.setDesc(field.description);
      setting.addText((text) =>
        text
          .setPlaceholder(field.placeholder ?? "")
          .setValue(params[field.key] ?? "")
          .onChange((v) => {
            params[field.key] = v;
          }),
      );
    }
  }

  private async save(): Promise<void> {
    if (!this.rule.name.trim()) {
      new Notice("Rule name cannot be empty.");
      return;
    }

    const actionHandler = this.plugin.engine.registry.getAction(
      this.rule.action.type,
    );
    for (const field of actionHandler?.fields ?? []) {
      if (!(this.rule.action.params[field.key] ?? "").trim()) {
        new Notice(`${field.label} cannot be empty.`);
        return;
      }
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
