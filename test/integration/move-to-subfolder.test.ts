import { afterEach, describe, expect, it } from "vitest";
import { ObsidianClient } from "./client";
import {
  cleanupFiles,
  delay,
  skipIfObsidianOffline,
  skipIfRenameEventsUnsupported,
  waitFor,
} from "./helpers";

const client = new ObsidianClient();
const isOffline = skipIfObsidianOffline(client);
const isRenameUnsupported = skipIfRenameEventsUnsupported(client);

const MONITORED = "IntegrationTestActions";
const UNMONITORED = "Inbox";

// offsetMonths allows computing next month's subfolder for midnight-boundary cleanup.
function dateSubfolder(offsetMonths = 0): string {
  const now = new Date();
  if (offsetMonths) now.setMonth(now.getMonth() + offsetMonths);
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
}

describe("move-to-date-subfolder action", () => {
  const created: string[] = [];

  afterEach(async () => {
    await cleanupFiles(client, created.splice(0));
  });

  it("moves created note into MM-YYYY subfolder", async ({ skip }) => {
    if (isOffline()) skip();

    const noteName = "it-date-note.md";
    const original = `${MONITORED}/${noteName}`;
    // Register the original path and both potential destinations (current and next month)
    // so cleanup succeeds even if the test runs exactly at a midnight month boundary.
    created.push(
      original,
      `${MONITORED}/${dateSubfolder()}/${noteName}`,
      `${MONITORED}/${dateSubfolder(1)}/${noteName}`,
    );

    await client.createFile(original, "hello");

    // Re-evaluate dateSubfolder() on each poll so a midnight rollover
    // doesn't cause a false timeout.
    await waitFor(async () => {
      try {
        await client.readFile(`${MONITORED}/${dateSubfolder()}/${noteName}`);
        return true;
      } catch {
        return false;
      }
    });
  });
});

describe("move-to-property-subfolder action", () => {
  const created: string[] = [];

  afterEach(async () => {
    await cleanupFiles(client, created.splice(0));
  });

  it("moves note to the subfolder named by the destination property on move trigger", async ({
    skip,
  }) => {
    if (isOffline() || isRenameUnsupported()) skip();

    const noteName = "it-prop-note.md";
    const source = `${UNMONITORED}/${noteName}`;
    const intermediate = `${MONITORED}/${noteName}`;
    const dest = `${MONITORED}/it-dest/${noteName}`;
    created.push(source, intermediate, dest);

    await client.createFile(source, "---\ndestination: it-dest\n---\nhello");
    // Give the metadata cache time to index the frontmatter before the move fires the rule.
    await delay(1000);
    await client.moveFile(source, MONITORED);

    await waitFor(async () => {
      try {
        await client.readFile(dest);
        return true;
      } catch {
        return false;
      }
    });
  });

  it("does not move note when destination property is absent", async ({
    skip,
  }) => {
    if (isOffline() || isRenameUnsupported()) skip();

    const noteName = "it-prop-noprop.md";
    const source = `${UNMONITORED}/${noteName}`;
    const dest = `${MONITORED}/${noteName}`;
    created.push(source, dest);

    await client.createFile(source, "no frontmatter");
    await client.moveFile(source, MONITORED);

    await delay(1000);

    const content = await client.readFile(dest);
    expect(content).toContain("no frontmatter");
  });
});
