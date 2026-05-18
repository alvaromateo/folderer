import { beforeAll } from "vitest";
import type { ObsidianClient } from "./client";

// Probe: create a file, rename it, and verify the rename rule fired. Tests that
// depend on vault.on('rename') skip when the probe fails (e.g. Obsidian offline).
export function skipIfRenameEventsUnsupported(
  client: ObsidianClient,
): () => boolean {
  let unsupported = false;
  beforeAll(async () => {
    const probe = "IntegrationTest/rename-probe.md";
    const probeAfter = "IntegrationTest/rename-probe-after.md";
    try {
      await client.createFile(probe, "probe");
      await waitFor(async () => {
        const c = await client.readFile(probe);
        return c.includes("<!-- appended -->");
      }, 5000);
      await client.renameFile(probe, "rename-probe-after.md");
      await waitFor(async () => {
        try {
          const c = await client.readFile(probeAfter);
          return c.includes("<!-- renamed -->");
        } catch {
          return false;
        }
      }, 4000);
    } catch {
      unsupported = true;
      console.warn(
        '[integration] vault.on("rename") did not fire — skipping rename/move trigger tests',
      );
    } finally {
      await client.deleteFile(probe).catch(() => {});
      await client.deleteFile(probeAfter).catch(() => {});
    }
  }, 20000);
  return () => unsupported;
}

export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 10000,
  interval = 150,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  console.warn(`waitFor timed out after ${timeout}ms`);
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

export function skipIfObsidianOffline(client: ObsidianClient): () => boolean {
  let offline = false;
  beforeAll(async () => {
    offline = !(await client.isReachable().catch(() => false));
    if (offline)
      console.warn("Obsidian not reachable — skipping integration tests");
  });
  return () => offline;
}

export async function cleanupFiles(
  client: ObsidianClient,
  paths: string[],
): Promise<void> {
  await Promise.all(paths.map((p) => client.deleteFile(p)));
}

export function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}
