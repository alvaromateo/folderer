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

describe("move-attachments action", () => {
  const created: string[] = [];

  afterEach(async () => {
    await cleanupFiles(client, created.splice(0));
  });

  it("moves embedded attachment to Attachments subfolder on move trigger", async ({
    skip,
  }) => {
    if (isOffline() || isRenameUnsupported()) skip();

    const noteName = "it-attach-note.md";
    const attachName = "it-attach-file.txt";
    const noteSource = `${UNMONITORED}/${noteName}`;
    const noteDest = `${MONITORED}/${noteName}`;
    const attachOrigin = `${UNMONITORED}/Attachments/${attachName}`;
    const attachDest = `${MONITORED}/Attachments/${attachName}`;
    created.push(noteSource, noteDest, attachOrigin, attachDest);

    await client.createAttachment(attachOrigin, "attachment data");
    await client.createFile(noteSource, `![[${attachName}]]`);
    // Give the metadata cache time to index the embed before the note is moved.
    await delay(1500);
    await client.moveFile(noteSource, MONITORED);

    await waitFor(async () => {
      try {
        await client.readFile(attachDest);
        return true;
      } catch {
        return false;
      }
    });
  });

  it("no-ops when note has no embeds", async ({ skip }) => {
    if (isOffline() || isRenameUnsupported()) skip();

    const noteName = "it-attach-noembeds.md";
    const noteSource = `${UNMONITORED}/${noteName}`;
    const noteDest = `${MONITORED}/${noteName}`;
    created.push(noteSource, noteDest);

    await client.createFile(noteSource, "no attachments here");
    await client.moveFile(noteSource, MONITORED);

    await delay(1000);

    const content = await client.readFile(noteDest);
    expect(content).toContain("no attachments here");
  });
});
