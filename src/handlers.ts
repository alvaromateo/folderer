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
	monitoredFolders: string[],
): boolean {
	const parentFolder = getParentFolder(filePath);
	return monitoredFolders.includes(parentFolder);
}
