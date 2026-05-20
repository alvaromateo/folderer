import { afterEach, describe, expect, it } from "vitest";
import { ObsidianClient } from "./client";
import { cleanupFiles, skipIfObsidianOffline, waitFor } from "./helpers";

const client = new ObsidianClient();
const isOffline = skipIfObsidianOffline(client);

const MONITORED = "IntegrationTest";
const UNMONITORED = "Inbox";

describe("create trigger", () => {
  const created: string[] = [];

  afterEach(async () => {
    await cleanupFiles(client, created.splice(0));
  });

  it("file created in monitored folder — append and prepend rules fire", async ({
    skip,
  }) => {
    if (isOffline()) skip();

    const path = `${MONITORED}/it-create-basic.md`;
    created.push(path);

    await client.createFile(path, "initial");
    await waitFor(async () => {
      const content = await client.readFile(path);
      return (
        content.includes("<!-- appended -->") &&
        content.includes("<!-- prepended -->")
      );
    });

    const content = await client.readFile(path);
    expect(content).toContain("<!-- appended -->");
    expect(content).toContain("<!-- prepended -->");
  });

  it("file created in non-monitored folder — no change", async ({ skip }) => {
    if (isOffline()) skip();

    const path = `${UNMONITORED}/it-create-unmonitored.md`;
    created.push(path);

    await client.createFile(path, "original");
    await new Promise((r) => setTimeout(r, 500));

    const content = await client.readFile(path);
    expect(content).not.toContain("<!-- appended -->");
  });

  it("disabled rule — skipped", async ({ skip }) => {
    if (isOffline()) skip();

    const path = `${MONITORED}/it-create-disabled.md`;
    created.push(path);

    await client.createFile(path, "initial");
    await waitFor(async () => {
      const content = await client.readFile(path);
      return content.includes("<!-- appended -->");
    });

    const content = await client.readFile(path);
    expect(content).not.toContain("<!-- disabled -->");
  });

  it("conditional rule — matching filename fires", async ({ skip }) => {
    if (isOffline()) skip();

    const path = `${MONITORED}/tagged-note.md`;
    created.push(path);

    await client.createFile(path, "initial");
    await waitFor(async () => {
      const content = await client.readFile(path);
      return content.includes("<!-- tagged -->");
    });

    const content = await client.readFile(path);
    expect(content).toContain("<!-- tagged -->");
  });

  it("conditional rule — non-matching filename skipped", async ({ skip }) => {
    if (isOffline()) skip();

    const path = `${MONITORED}/no-tag-note.md`;
    created.push(path);

    await client.createFile(path, "initial");
    await waitFor(async () => {
      const content = await client.readFile(path);
      return content.includes("<!-- appended -->");
    });

    const content = await client.readFile(path);
    expect(content).not.toContain("<!-- tagged -->");
  });
});
