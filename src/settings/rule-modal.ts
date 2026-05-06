import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import type FoldererPlugin from "../main";
import type { RuleData } from "../types";
import RuleModalContent from "./components/rule-modal/Content.svelte";
import type { MonitoredFolder } from "./folder-settings";

export class RuleModal extends Modal {
  private component: object | undefined;

  constructor(
    private plugin: FoldererPlugin,
    private monitoredFolder: MonitoredFolder,
    private selectedRule: RuleData | null,
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
