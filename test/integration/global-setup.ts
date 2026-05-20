import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CLI_PATH = process.env.OBSIDIAN_CLI_PATH ?? "obsidian";
const VAULT_NAME = process.env.OBSIDIAN_VAULT_NAME ?? "test-vault";

export async function setup(): Promise<void> {
  try {
    await execFileAsync(CLI_PATH, ["version"], { timeout: 2000 });
  } catch {
    // CLI not available — tests will skip themselves via skipIfObsidianOffline
    return;
  }

  // If the plugin failed to load (e.g. broken symlink from a previous Docker run),
  // it won't appear in Obsidian's registry and plugin:reload will fail. Ensure it
  // is enabled first via eval, then reload so all event handlers are registered fresh.
  await execFileAsync(CLI_PATH, [
    `vault=${VAULT_NAME}`,
    "eval",
    "code=(async()=>{localStorage.setItem('enable-plugin-'+app.appId,'true');await app.plugins.loadManifests();await app.plugins.enablePlugin('folderer')})()",
  ]);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await execFileAsync(CLI_PATH, [
    `vault=${VAULT_NAME}`,
    "plugin:reload",
    "id=folderer",
  ]);
  // Give the plugin time to reinitialize and register vault event handlers
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
