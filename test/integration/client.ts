import { exec } from "node:child_process";
import { promisify } from "node:util";
import { delay } from "./helpers";

const execAsync = promisify(exec);

const CLI_PATH = process.env.OBSIDIAN_CLI_PATH ?? "obsidian";
const VAULT_NAME = process.env.OBSIDIAN_VAULT_NAME ?? "test-vault";

function vaultArgs(): string[] {
  return VAULT_NAME ? [`vault=${VAULT_NAME}`] : [];
}

/**
 * The functions wait a bit - 100 ms - after running to give time to obsidian
 * to run any triggers.
 */
export class ObsidianClient {
  async isReachable(): Promise<boolean> {
    try {
      await execAsync([CLI_PATH, "version"].join(" "), { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async createFile(path: string, content = ""): Promise<void> {
    await execAsync(
      [
        CLI_PATH,
        ...vaultArgs(),
        "create",
        `path=${path}`,
        `content=${content}`,
        "overwrite",
      ].join(" "),
    );
    await delay(100);
  }

  async readFile(path: string): Promise<string> {
    const { stdout } = await execAsync(
      [CLI_PATH, ...vaultArgs(), "read", `path=${path}`].join(" "),
    );
    // obsidian-cli returns "Error: ..." with exit 0 for missing files
    if (stdout.startsWith("Error:")) throw new Error(stdout.trim());
    await delay(100);
    return stdout;
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await execAsync(
        [CLI_PATH, ...vaultArgs(), "delete", `path=${path}`, "permanent"].join(
          " ",
        ),
      );
    } catch {
      // ignore not-found errors
    }
    await delay(100);
  }

  // Uses obsidian-cli's native rename command, which calls vault.rename() and
  // fires vault.on('rename') correctly on both local macOS and native Linux FS.
  async renameFile(fromPath: string, newName: string): Promise<void> {
    await execAsync(
      [
        CLI_PATH,
        ...vaultArgs(),
        "rename",
        `path=${fromPath}`,
        `name=${newName}`,
      ].join(" "),
    );
    await delay(100);
  }

  async moveFile(fromPath: string, toFolder: string): Promise<void> {
    await execAsync(
      [
        CLI_PATH,
        ...vaultArgs(),
        "move",
        `path=${fromPath}`,
        `to=${toFolder}`,
      ].join(" "),
    );
    await delay(100);
  }
}
