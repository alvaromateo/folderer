export interface FoldererSettings {
	monitoredFolders: string[];
	appendText: string;
}

export const DEFAULT_SETTINGS: FoldererSettings = {
	monitoredFolders: [],
	appendText: "folderer",
};
