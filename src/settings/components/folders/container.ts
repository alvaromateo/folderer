import type FoldererPlugin from "../../../main";
import type { MonitoredFolder } from "../../monitored-folder";
import { Folder } from "./folder";

export class FoldersContainer {
  plugin: FoldererPlugin;
  containerElement: HTMLDivElement;
  renderedSections: Folder[];

  constructor(plugin: FoldererPlugin, container: HTMLDivElement) {
    this.plugin = plugin;
    this.containerElement = container;
    this.renderedSections = [];
    this.plugin.settings.addRenderCallback(this.render.bind(this));
  }

  /**
   * Items are added at the end, but can be removed from anywhere.
   * So differences between folders and renderedSections can be:
   * - extra element in the middle of renderedSections (element removed)
   * - extra element at the end of folders (element added)
   */
  render(folders: MonitoredFolder[]): void {
    let foldersIndex = 0;
    let renderedSectionIndex = 0;
    while (
      foldersIndex < folders.length &&
      renderedSectionIndex < this.renderedSections.length
    ) {
      if (
        folders[foldersIndex]?.path !==
        this.renderedSections[renderedSectionIndex]?.folderPath
      ) {
        this.renderedSections[renderedSectionIndex]?.element.remove();
        this.renderedSections.splice(renderedSectionIndex, 1);
      } else {
        ++foldersIndex;
        ++renderedSectionIndex;
      }
    }
    while (foldersIndex < folders.length) {
      // we reached the end of renderedSections, so we need to add elements
      const element = this.containerElement.createDiv("folderer_folder");
      const folderPath = folders[foldersIndex]?.path || "";
      const item = new Folder(this.plugin, folderPath, element);
      item.render();
      this.renderedSections.splice(renderedSectionIndex, 0, item);
      ++renderedSectionIndex;
      ++foldersIndex;
    }
    while (renderedSectionIndex < this.renderedSections.length) {
      // we reached the end of folders, so we need to remove elements
      this.renderedSections[renderedSectionIndex]?.element.remove();
      this.renderedSections.splice(renderedSectionIndex, 1);
    }
  }
}
