import type { FoldererSettingsData } from "../types";
import { MonitoredFolder } from "./monitored-folder";

type RenderCallback = (folders: MonitoredFolder[]) => void;

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

  findFolder(path: string): MonitoredFolder | undefined {
    return this._monitoredFolders.filter((mf) => mf.path === path).first();
  }

  addFolder(folder: MonitoredFolder): void {
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
      data.monitoredFolders.map(MonitoredFolder.fromJSON),
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
