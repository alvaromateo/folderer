import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { delay } from "./helpers";

const execFileAsync = promisify(execFile);

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
      await execFileAsync(CLI_PATH, ["version"], { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async createFile(path: string, content = ""): Promise<void> {
    // Use execFileAsync (not exec) so content with spaces, newlines, or
    // special characters is passed as a single argument rather than shell-tokenized.
    await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "create",
      `path=${path}`,
      `content=${content}`,
      "overwrite",
    ]);
    await delay(100);
  }

  async readFile(path: string): Promise<string> {
    const { stdout } = await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "read",
      `path=${path}`,
    ]);
    // obsidian-cli returns "Error: ..." with exit 0 for missing files
    if (stdout.startsWith("Error:")) throw new Error(stdout.trim());
    await delay(100);
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
    await delay(100);
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
    await delay(100);
  }

  // Creates a non-markdown file (attachment) in the vault using Obsidian's JS API
  // via the eval command, since the CLI's create command only handles markdown files.
  // Any stale copy from a previous failed run is deleted first.
  async createAttachment(path: string, content = ""): Promise<void> {
    const code = `(async() => {
      try {
        const f = app.vault.getAbstractFileByPath(${JSON.stringify(path)});
        if (f) await app.vault.delete(f);
      } catch (e) {}
      await app.vault.create(${JSON.stringify(path)},${JSON.stringify(content)});
    })()`;
    await execFileAsync(CLI_PATH, [...vaultArgs(), "eval", `code=${code}`]);
    await delay(500);
  }

  async moveFile(fromPath: string, toFolder: string): Promise<void> {
    await execFileAsync(CLI_PATH, [
      ...vaultArgs(),
      "move",
      `path=${fromPath}`,
      `to=${toFolder}`,
    ]);
    await delay(100);
  }
}
