import type FoldererPlugin from "../../../main";
import type { MonitoredFolder } from "../../monitored-folder";
import type { Rule } from "../../types";
import { RuleRow } from "./rule-row";

export class RulesContainer {
  plugin: FoldererPlugin;
  monitoredFolder: MonitoredFolder;
  containerElement: HTMLDivElement;
  renderedRules: RuleRow[];

  constructor(
    plugin: FoldererPlugin,
    monitoredFolder: MonitoredFolder,
    container: HTMLDivElement,
  ) {
    this.plugin = plugin;
    this.monitoredFolder = monitoredFolder;
    this.containerElement = container;
    this.renderedRules = [];
    this.monitoredFolder.addRenderCallback(this.render.bind(this));
  }

  /**
   * Rules are added at the end, but can be removed from anywhere.
   * So differences between Rules and renderedRules can be:
   * - extra element in the middle of renderedRules (element removed)
   * - extra element at the end of rules (element added)
   */
  render(rules: Rule[]): void {
    let rulesIndex = 0;
    let renderedRulesIndex = 0;
    while (
      rulesIndex < rules.length &&
      renderedRulesIndex < this.renderedRules.length
    ) {
      if (
        rules[rulesIndex]?.id !== this.renderedRules[renderedRulesIndex]?.ruleId
      ) {
        this.renderedRules[renderedRulesIndex]?.element.remove();
        this.renderedRules.splice(renderedRulesIndex, 1);
      } else {
        if (this.renderedRules[renderedRulesIndex]?.isModified) {
          // re-render because the item has been modified
          this.renderedRules[renderedRulesIndex]?.render();
        }
        ++rulesIndex;
        ++renderedRulesIndex;
      }
    }
    while (rulesIndex < rules.length) {
      // we reached the end of renderedSections, so we need to add elements
      const element = this.containerElement.createDiv("folderer_rule");
      const ruleId = rules[rulesIndex]?.id || "";
      const item = new RuleRow(
        this.plugin,
        this.monitoredFolder,
        element,
        ruleId,
      );
      item.render();
      this.renderedRules.splice(renderedRulesIndex, 0, item);
      ++renderedRulesIndex;
      ++rulesIndex;
    }
    while (renderedRulesIndex < this.renderedRules.length) {
      // we reached the end of folders, so we need to remove elements
      this.renderedRules[renderedRulesIndex]?.element.remove();
      this.renderedRules.splice(renderedRulesIndex, 1);
    }
  }
}
