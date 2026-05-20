import { afterEach, describe, expect, it } from "vitest";
import { ObsidianClient } from "./client";
import {
  cleanupFiles,
  skipIfObsidianOffline,
  skipIfRenameEventsUnsupported,
  waitFor,
} from "./helpers";

const client = new ObsidianClient();
const isOffline = skipIfObsidianOffline(client);
const isRenameUnsupported = skipIfRenameEventsUnsupported(client);

const MONITORED = "IntegrationTest";
const UNMONITORED = "Inbox";

describe("rename trigger", () => {
  const created: string[] = [];

  afterEach(async () => {
    await cleanupFiles(client, created.splice(0));
  });

  it("cross-folder move into monitored folder — move trigger fires", async ({
    skip,
  }) => {
    if (isOffline() || isRenameUnsupported()) skip();

    const source = `${UNMONITORED}/it-move-source.md`;
    const dest = `${MONITORED}/it-move-source.md`;
    created.push(source);
    created.push(dest);

    await client.createFile(source, "initial");
    await client.moveFile(source, MONITORED);

    await waitFor(async () => {
      const content = await client.readFile(dest);
      return content.includes("<!-- moved -->");
    });

    const content = await client.readFile(dest);
    expect(content).toContain("<!-- moved -->");
  });

  it("in-folder rename — rename trigger fires", async ({ skip }) => {
    if (isOffline() || isRenameUnsupported()) skip();

    const before = `${MONITORED}/it-rename-before.md`;
    const after = `${MONITORED}/it-rename-after.md`;
    created.push(before);
    created.push(after);

    await client.createFile(before, "initial");
    await waitFor(async () => {
      const content = await client.readFile(before);
      return content.includes("<!-- appended -->");
    });

    await client.renameFile(before, "it-rename-after.md");

    await waitFor(async () => {
      const content = await client.readFile(after);
      return content.includes("<!-- renamed -->");
    });

    const content = await client.readFile(after);
    expect(content).toContain("<!-- renamed -->");
  });

  it("rename rule does not fire on create", async ({ skip }) => {
    if (isOffline()) skip();

    const path = `${MONITORED}/it-no-rename-on-create.md`;
    created.push(path);

    await client.createFile(path, "initial");
    await waitFor(async () => {
      const content = await client.readFile(path);
      return content.includes("<!-- appended -->");
    });

    const content = await client.readFile(path);
    expect(content).not.toContain("<!-- renamed -->");
  });
});
