import { type App, PluginSettingTab } from "obsidian";
import { mount, unmount } from "svelte";
import type FoldererPlugin from "../main";
import SettingsTab from "./components/SettingsTab.svelte";

export class FoldererSettingTab extends PluginSettingTab {
  plugin: FoldererPlugin;
  private component: object | undefined;

  constructor(app: App, plugin: FoldererPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    if (this.component) {
      unmount(this.component);
    }
    this.containerEl.empty();
    this.component = mount(SettingsTab, {
      target: this.containerEl,
      props: { plugin: this.plugin },
    });
  }

  hide(): void {
    if (this.component) {
      unmount(this.component);
      this.component = undefined;
    }
    super.hide();
  }
}
