import type { FoldererSettingsData } from "../types";
import { MonitoredFolderSettings } from "./folder-settings";

type RenderCallback = (folders: MonitoredFolderSettings[]) => void;

export class FoldererSettings {
  private renderCallbacks: Set<RenderCallback> = new Set();

  constructor(private _monitoredFolders: MonitoredFolder[] = []) {}

  public get monitoredFolders() {
    return this._monitoredFolders;
  }

  addRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.add(callback);
  }

  removeRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.delete(callback);
  }

  findFolder(path: string): MonitoredFolderSettings | undefined {
    return this._monitoredFolders.filter((mf) => mf.path === path).first();
  }

  addFolder(folder: MonitoredFolderSettings): void {
    this._monitoredFolders.push(folder);
    this.renderCallbacks.forEach((cb) => {
      cb(this._monitoredFolders);
    });
  }

  toJSON(): FoldererSettingsData {
    return { monitoredFolders: this._monitoredFolders.map((f) => f.toJSON()) };
  }

  static fromJSON(data: FoldererSettingsData): FoldererSettings {
    return new FoldererSettings(
      data.monitoredFolders.map(MonitoredFolderSettings.fromJSON),
    );
  }

  removeFolder(path: string): void {
    const folder = this.findFolder(path);
    if (folder) {
      this._monitoredFolders.remove(folder);
      this.renderCallbacks.forEach((cb) => {
        cb(this._monitoredFolders);
      });
    }
  }
}
