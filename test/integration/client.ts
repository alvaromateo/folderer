import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CLI_PATH = process.env.OBSIDIAN_CLI_PATH ?? "obsidian";
const VAULT_NAME = process.env.OBSIDIAN_VAULT_NAME ?? "test-vault";

function vaultArgs(): string[] {
  return VAULT_NAME ? [`vault=${VAULT_NAME}`] : [];
}

export class ObsidianClient {
  async isReachable(): Promise<boolean> {
    try {
      await execFileAsync(CLI_PATH, ["version"], { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async createFile(path: string, content = ""): Promise<void> {
    await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "create",
      `path=${path}`,
      `content=${content}`,
      "overwrite",
    ]);
  }

  async readFile(path: string): Promise<string> {
    const { stdout } = await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "read",
      `path=${path}`,
    ]);
    // obsidian-cli returns "Error: ..." with exit 0 for missing files
    if (stdout.startsWith("Error:")) throw new Error(stdout.trim());
    return stdout;
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await execFileAsync(CLI_PATH, [
        ...vaultArgs(),
        "delete",
        `path=${path}`,
        "permanent",
      ]);
    } catch {
      // ignore not-found errors
    }
  }

  // Uses obsidian-cli's native rename command, which calls vault.rename() and
  // fires vault.on('rename') correctly on both local macOS and native Linux FS.
  async renameFile(fromPath: string, newName: string): Promise<void> {
    await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "rename",
      `path=${fromPath}`,
      `name=${newName}`,
    ]);
  }

  async moveFile(fromPath: string, toFolder: string): Promise<void> {
    await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "move",
      `path=${fromPath}`,
      `to=${toFolder}`,
    ]);
  }
}
