# Folderer — Obsidian Plugin

An Obsidian plugin that watches user-configured folders and appends text to markdown files when they are created in or moved into those folders.

## Verification

- After you finish applying any code changes, use the test-writer-vitest agent to write/update unit tests.
The agent should verify that the tests it writes pass.
- When the tests are done and passing, use the code-review-expert agent and ask it to review the changes done.
- Check with me before applying the fixes/changes suggested by the code-review-expert agent.
- At the end, run `mise exec node -- npm run fix` and fix any warnings or errors that can't be fixed automatically.

## Commands

```bash
mise exec node -- npm run build       # one-shot production build → dist/main.js
mise exec node -- npm run dev         # watch mode (rebuilds on save)
mise exec node -- npm test            # run unit tests (Vitest)
mise exec node -- npm run test:watch  # Vitest interactive watch
mise exec node -- npm run fix         # lint + format + import sort (Biome, auto-fixes)
mise exec node -- npm run lint        # lint only
mise exec node -- npm run format      # format only
```

> Node is managed by `mise` (`mise.toml`). All `npm` commands must be prefixed with `mise exec node --` since `npm`/`node` are not on the global PATH.

## Project Structure

```
src/main.ts                    Plugin entry point (onload, event handlers)
src/handlers.ts                Pure logic: getParentFolder, isCrossfolderMove, isInMonitoredFolder
src/settings/settings.ts       FoldererSettings interface + DEFAULT_SETTINGS
src/settings/settings-tab.ts   PluginSettingTab UI (add/remove monitored folders)
test/                          Vitest unit tests (handlers only — no Obsidian mocking needed)
test-vault/                    Local Obsidian vault used for manual testing
dist/                          Build output (gitignored)
esbuild.config.mjs             Build config: entry src/main.ts → dist/main.js (CommonJS, ES2018 target)
```

## Architecture

The plugin registers two vault event handlers in `onload()`:

- **`vault.on('create')`** — fires when a new file is written to disk
- **`vault.on('rename')`** — fires for both renames and moves; filtered to cross-folder moves only via `isCrossfolderMove()`

Obsidian has no dedicated `move` event. The distinction between an in-folder rename and a cross-folder move is detected by comparing the parent directory of the new path against the parent of the old path.

All business logic lives in `src/handlers.ts` as pure functions with no Obsidian imports, so tests require zero mocking.

File content is modified with `vault.process()` (atomic read-modify-write, prevents race conditions).

## TypeScript Config

`tsconfig.json` uses `module: CommonJS` + `moduleResolution: node`. This explicitly matches Obsidian's CJS runtime — esbuild outputs `format: 'cjs'` consistently with what TypeScript expects.

## Test Vault

The test vault lives at `./test-vault/`. The plugin is wired via symlinks:

```
test-vault/.obsidian/plugins/folderer/main.js       → dist/main.js (symlink)
test-vault/.obsidian/plugins/folderer/manifest.json → manifest.json (symlink)
```

To set up (one-time, after cloning):
```bash
mkdir -p test-vault/.obsidian/plugins/folderer
ln -sf "$(pwd)/dist/main.js" test-vault/.obsidian/plugins/folderer/main.js
ln -sf "$(pwd)/manifest.json" test-vault/.obsidian/plugins/folderer/manifest.json
```

The plugin is pre-registered in `test-vault/.obsidian/community-plugins.json`. Open Obsidian pointing at `./test-vault/` and enable the Folderer plugin in Community Plugins settings.

### Manual Testing

1. Run `mise exec node -- npm run dev` to start watch mode
2. Open Obsidian on `./test-vault/`
3. Go to Settings → Folderer → add `Literature` as a monitored folder
4. Create a `.md` file inside `Literature/` — content should end with `\nfolderer`
5. Move a `.md` file from another folder into `Literature/` — same result
6. Rename a file within `Literature/` — content should **not** be modified
7. Move a file into a non-monitored folder — content should **not** be modified

## Skills

| Skill | When to use |
|-------|-------------|
| `obsidian-reference` | Writing plugin features — API patterns, lifecycle, gotchas |
| `obsidian` | Interacting with the test vault via MCP or CLI |
| `plugin-testing` | Not yet active — to be filled once testing workflow is defined |
