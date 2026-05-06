import { describe, expect, it, vi } from "vitest";
import { MonitoredFolder } from "../../src/settings/folder-settings";
import { FoldererSettings } from "../../src/settings/settings";
import type { RuleData } from "../../src/types";

// Polyfill Obsidian Array extensions used by the classes under test
// biome-ignore lint/suspicious/noExplicitAny: pollyfill
(Array.prototype as any).first = function () {
  return this[0];
};
// biome-ignore lint/suspicious/noExplicitAny: pollyfill
(Array.prototype as any).remove = function <T>(item: T) {
  const i = this.indexOf(item);
  if (i > -1) this.splice(i, 1);
  return this;
};

function mkFolder(path: string, rules: RuleData[] = []): MonitoredFolder {
  return new MonitoredFolder(path, rules);
}

describe("FoldererSettings constructor", () => {
  it("defaults monitoredFolders to an empty array when not provided", () => {
    const settings = new FoldererSettings();
    expect(settings.monitoredFolders).toEqual([]);
  });

  it("stores the provided monitored folders", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    expect(settings.monitoredFolders).toHaveLength(1);
    expect(settings.monitoredFolders[0]).toBe(folder);
  });
});

describe("FoldererSettings.monitoredFolders getter", () => {
  it("returns the internal folders array", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    expect(settings.monitoredFolders).toContain(folder);
  });
});

describe("FoldererSettings.findFolder", () => {
  it("returns the folder with the matching path", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    expect(settings.findFolder("Literature")).toBe(folder);
  });

  it("returns undefined when no folder has that path", () => {
    const settings = new FoldererSettings([mkFolder("Literature")]);
    expect(settings.findFolder("Drafts")).toBeUndefined();
  });

  it("returns undefined when the folders list is empty", () => {
    const settings = new FoldererSettings();
    expect(settings.findFolder("Literature")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    const settings = new FoldererSettings([mkFolder("Literature")]);
    expect(settings.findFolder("literature")).toBeUndefined();
  });

  it("returns the first match when duplicate paths exist", () => {
    const first = mkFolder("Literature");
    const second = mkFolder("Literature");
    const settings = new FoldererSettings([first, second]);
    expect(settings.findFolder("Literature")).toBe(first);
  });
});

describe("FoldererSettings.addFolder", () => {
  it("appends the folder to the list", () => {
    const settings = new FoldererSettings();
    const folder = mkFolder("Literature");
    settings.addFolder(folder);
    expect(settings.monitoredFolders).toContain(folder);
    expect(settings.monitoredFolders).toHaveLength(1);
  });

  it("fires registered render callbacks with the updated list", () => {
    const settings = new FoldererSettings();
    const cb = vi.fn();
    settings.addRenderCallback(cb);
    const folder = mkFolder("Literature");
    settings.addFolder(folder);
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith([folder]);
  });

  it("fires all registered callbacks", () => {
    const settings = new FoldererSettings();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    settings.addRenderCallback(cb1);
    settings.addRenderCallback(cb2);
    settings.addFolder(mkFolder("Literature"));
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("does not fire callbacks that have been removed", () => {
    const settings = new FoldererSettings();
    const cb = vi.fn();
    settings.addRenderCallback(cb);
    settings.removeRenderCallback(cb);
    settings.addFolder(mkFolder("Literature"));
    expect(cb).not.toHaveBeenCalled();
  });

  it("accumulates multiple added folders", () => {
    const settings = new FoldererSettings();
    settings.addFolder(mkFolder("Literature"));
    settings.addFolder(mkFolder("Archive"));
    expect(settings.monitoredFolders).toHaveLength(2);
  });
});

describe("FoldererSettings.removeFolder", () => {
  it("removes the folder with the given path", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    settings.removeFolder("Literature");
    expect(settings.monitoredFolders).toHaveLength(0);
  });

  it("fires registered render callbacks after removal", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    const cb = vi.fn();
    settings.addRenderCallback(cb);
    settings.removeFolder("Literature");
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith([]);
  });

  it("is a no-op when the path does not exist", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    const cb = vi.fn();
    settings.addRenderCallback(cb);
    settings.removeFolder("does-not-exist");
    expect(settings.monitoredFolders).toHaveLength(1);
    expect(cb).not.toHaveBeenCalled();
  });

  it("is a no-op on an empty folders list", () => {
    const settings = new FoldererSettings();
    const cb = vi.fn();
    settings.addRenderCallback(cb);
    settings.removeFolder("Literature");
    expect(settings.monitoredFolders).toHaveLength(0);
    expect(cb).not.toHaveBeenCalled();
  });

  it("removes only the targeted folder when multiple folders are present", () => {
    const lit = mkFolder("Literature");
    const arc = mkFolder("Archive");
    const settings = new FoldererSettings([lit, arc]);
    settings.removeFolder("Literature");
    expect(settings.monitoredFolders).toHaveLength(1);
    expect(settings.monitoredFolders[0]).toBe(arc);
  });
});

describe("FoldererSettings render callbacks", () => {
  it("addRenderCallback registers the same callback only once (Set semantics)", () => {
    const settings = new FoldererSettings();
    const cb = vi.fn();
    settings.addRenderCallback(cb);
    settings.addRenderCallback(cb);
    settings.addFolder(mkFolder("Literature"));
    expect(cb).toHaveBeenCalledOnce();
  });

  it("removeRenderCallback silently ignores a callback that was never registered", () => {
    const settings = new FoldererSettings();
    const cb = vi.fn();
    expect(() => settings.removeRenderCallback(cb)).not.toThrow();
  });
});

describe("FoldererSettings.toJSON", () => {
  it("returns a plain object with monitoredFolders array", () => {
    const folder = mkFolder("Literature");
    const settings = new FoldererSettings([folder]);
    expect(settings.toJSON()).toEqual({
      monitoredFolders: [{ path: "Literature", rules: [] }],
    });
  });

  it("returns empty monitoredFolders array when no folders exist", () => {
    const settings = new FoldererSettings();
    expect(settings.toJSON()).toEqual({ monitoredFolders: [] });
  });

  it("delegates serialization to each folder's toJSON", () => {
    const spyFolder = mkFolder("Literature");
    const toJSONSpy = vi.spyOn(spyFolder, "toJSON");
    const settings = new FoldererSettings([spyFolder]);
    settings.toJSON();
    expect(toJSONSpy).toHaveBeenCalledOnce();
  });
});

describe("FoldererSettings.fromJSON", () => {
  it("constructs a FoldererSettings from JSON data", () => {
    const data = {
      monitoredFolders: [{ path: "Literature", rules: [] }],
    };
    const settings = FoldererSettings.fromJSON(data);
    expect(settings).toBeInstanceOf(FoldererSettings);
    expect(settings.monitoredFolders).toHaveLength(1);
    expect(settings.monitoredFolders[0]).toBeInstanceOf(MonitoredFolder);
    expect(settings.monitoredFolders[0].path).toBe("Literature");
  });

  it("constructs with no folders when monitoredFolders is empty", () => {
    const settings = FoldererSettings.fromJSON({ monitoredFolders: [] });
    expect(settings.monitoredFolders).toHaveLength(0);
  });

  it("round-trips through toJSON and fromJSON", () => {
    const original = new FoldererSettings([
      mkFolder("Literature"),
      mkFolder("Archive"),
    ]);
    const restored = FoldererSettings.fromJSON(original.toJSON());
    expect(restored.monitoredFolders).toHaveLength(2);
    expect(restored.monitoredFolders[0].path).toBe("Literature");
    expect(restored.monitoredFolders[1].path).toBe("Archive");
  });
});
