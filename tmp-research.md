# Integration Tests via Obsidian Local REST API

## Context

The existing test suite covers individual handlers, conditions, actions, and the RuleEngine in isolation with mocks. What's missing is a test that verifies the **full end-to-end flow** against a real Obsidian instance:

> vault event fires → `main.ts` handler detects monitored folder → RuleEngine evaluates conditions and executes actions → file content is modified on disk

We'll use the **obsidian-local-rest-api** community plugin as a bridge between Vitest tests and a running Obsidian instance. File creation goes through Obsidian's vault API (so `vault.on("create")` fires naturally), and renames/moves are done with `fs.rename()` which Obsidian's file watcher picks up. Tests live under `test/integration/` behind a separate Vitest config so `npm test` continues to run only the fast unit tests.

---

## One-Time Manual Setup

Before running integration tests, the following needs to be done once:

1. **Download** the latest release of [obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api) and place `main.js`, `manifest.json` into `test-vault/.obsidian/plugins/obsidian-local-rest-api/`
2. **Enable** the plugin in Obsidian (Settings → Community Plugins → enable *Local REST API*)
3. **Get the API key** from Settings → Local REST API → copy the key
4. **Create `.env.integration`** (git-ignored) at project root:
   ```
   OBSIDIAN_API_URL=https://127.0.0.1:27124
   OBSIDIAN_API_KEY=<your-key>
   ```

> The plugin serves HTTPS on port 27124. Tests disable cert validation for the self-signed cert via `NODE_TLS_REJECT_UNAUTHORIZED=0` in the Vitest config.

---

## Test Vault Configuration

Add an `IntegrationTest` monitored folder to `test-vault/.obsidian/plugins/folderer/data.json` with these rules (using the current `actions` plural format per `src/types.ts`):

| Rule ID | Name | Trigger | Condition | Action |
|---|---|---|---|---|
| `it-append` | Append Rule | `create` | none | append-text `<!-- appended -->` |
| `it-prepend` | Prepend Rule | `create` | none | prepend-text `<!-- prepended -->` |
| `it-conditional` | Conditional Rule | `create` | `filename-matches` contains `"tagged"` | append-text `<!-- tagged -->` |
| `it-rename` | Rename Rule | `rename` | none | append-text `<!-- renamed -->` |
| `it-disabled` | Disabled Rule | `create` | none (disabled) | append-text `<!-- disabled -->` |

---

## Files to Create

### `vitest.integration.config.ts`
Separate Vitest config that:
- Points `include` to `test/integration/**/*.test.ts`
- Sets `environment: "node"`
- Sets `NODE_TLS_REJECT_UNAUTHORIZED=0` via `process.env` in `globalSetup`
- Loads `.env.integration` via `dotenv` (add as devDependency)

### `test/integration/client.ts`
Typed wrapper around the obsidian-local-rest-api HTTP endpoints:
```ts
class ObsidianClient {
  async isReachable(): Promise<boolean>              // HEAD / with timeout
  async createFile(path: string, content?: string): Promise<void>  // PUT /vault/{path}
  async readFile(path: string): Promise<string>      // GET /vault/{path}
  async deleteFile(path: string): Promise<void>      // DELETE /vault/{path} (404 ok)
}
```
Reads `OBSIDIAN_API_URL` / `OBSIDIAN_API_KEY` from `process.env`.

### `test/integration/helpers.ts`
- `waitFor(condition, timeout=3000, interval=100)` — polls until condition returns true or throws on timeout
- `skipIfObsidianOffline(client)` — calls `client.isReachable()` in `beforeAll`, skips suite with `test.skip` if false
- `cleanupFiles(client, paths)` — deletes all paths (ignores 404); used in `afterEach`

### `test/integration/create-trigger.test.ts`
Scenarios testing `vault.on("create")` via REST API `PUT`:

1. **File created in monitored folder → append + prepend rules fire**  
   Create `IntegrationTest/it-create-basic.md` → wait for plugin → assert content contains both `<!-- appended -->` and `<!-- prepended -->`

2. **File created in non-monitored folder → no change**  
   Create `Inbox/it-create-unmonitored.md` → wait 500ms → assert content unchanged

3. **Disabled rule → skipped**  
   Create `IntegrationTest/it-create-disabled.md` → assert content does NOT contain `<!-- disabled -->`

4. **Conditional rule — matching file → rule fires**  
   Create `IntegrationTest/tagged-note.md` → assert content contains `<!-- tagged -->`

5. **Conditional rule — non-matching file → rule skipped**  
   Create `IntegrationTest/no-tag-note.md` → assert content does NOT contain `<!-- tagged -->`

### `test/integration/rename-trigger.test.ts`
Scenarios using `fs.rename()` + polling (since REST API has no rename endpoint):

1. **Cross-folder move into monitored folder → move trigger fires**  
   Create `Inbox/it-move-source.md` via REST API → `fs.rename()` into `IntegrationTest/` → `waitFor` content contains `<!-- appended -->`

2. **In-folder rename → "rename" trigger fires**  
   Create `IntegrationTest/it-rename-before.md` via REST API → `fs.rename()` to `IntegrationTest/it-rename-after.md` → `waitFor` content contains `<!-- renamed -->`

3. **Rename rule does NOT fire on create**  
   Create `IntegrationTest/it-no-rename-on-create.md` → assert content does NOT contain `<!-- renamed -->`

---

## Files to Modify

| File | Change |
|---|---|
| `package.json` | Add `"test:integration": "vitest run --config vitest.integration.config.ts"` script |
| `package.json` | Add `dotenv` as devDependency |
| `test-vault/.obsidian/community-plugins.json` | Add `"obsidian-local-rest-api"` to the array |
| `test-vault/.obsidian/plugins/folderer/data.json` | Add the `IntegrationTest` monitored folder + rules described above |
| `.gitignore` | Add `.env.integration` |

---

## Verification

1. Open Obsidian on `./test-vault/`, confirm Folderer + Local REST API are both enabled
2. Run `mise exec node -- npm run test:integration` → all tests pass
3. Check `test-vault/IntegrationTest/` — test files cleaned up by `afterEach`
4. Stop Obsidian and re-run → tests skip with message *"Obsidian not reachable — skipping integration tests"*
5. Run `mise exec node -- npm test` → unit tests still pass unchanged
