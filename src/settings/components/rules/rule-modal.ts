import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import type FoldererPlugin from "../../../main";
import type { Rule } from "../../../types";
import type { MonitoredFolder } from "../../monitored-folder";
import RuleModalContent from "../svelte/RuleModalContent.svelte";

export class RuleModal extends Modal {
  private component: object | undefined;

  constructor(
    private plugin: FoldererPlugin,
    private monitoredFolder: MonitoredFolder,
    private selectedRule: Rule | null,
  ) {
    super(plugin.app);
  }

  onOpen(): void {
    this.setTitle(this.selectedRule === null ? "Add rule" : "Edit rule");
    this.component = mount(RuleModalContent, {
      target: this.contentEl,
      props: {
        plugin: this.plugin,
        folder: this.monitoredFolder,
        selectedRule: this.selectedRule,
        onClose: () => this.close(),
      },
    });
  }

  onClose(): void {
    if (this.component) {
      unmount(this.component);
      this.component = undefined;
    }
    this.contentEl.empty();
  }
}
