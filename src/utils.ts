import type { MonitoredFolder } from "./settings/folder-settings";

export function getParentFolder(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  if (lastSlash === -1) return "/";
  return filePath.substring(0, lastSlash);
}

export function isCrossfolderMove(newPath: string, oldPath: string): boolean {
  return getParentFolder(newPath) !== getParentFolder(oldPath);
}

export function isInMonitoredFolder(
  filePath: string,
  monitoredFolders: MonitoredFolder[],
): boolean {
  const parentFolder = getParentFolder(filePath);
  return monitoredFolders.some((mf) => mf.path === parentFolder);
}

export function getMatchingFolder(
  filePath: string,
  monitoredFolders: MonitoredFolder[],
): MonitoredFolder | undefined {
  const parentFolder = getParentFolder(filePath);
  return monitoredFolders.find((mf) => mf.path === parentFolder);
}

export function getFrontMatterString(
  fm: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!fm) return;
  // string
  if (typeof fm[key] === "string") {
    return fm[key];
  }
  // number
  else if (typeof fm[key] === "number") {
    return fm[key].toString();
  }
  // boolean
  else if (typeof fm[key] === "boolean") {
    return fm[key] ? "true" : "false";
  }
  // null
  else {
    return undefined;
  }
}
