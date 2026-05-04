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
