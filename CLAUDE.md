# Folderer — Obsidian Plugin

An Obsidian plugin that watches user-configured folders and runs configurable rules (conditions + actions) on markdown files when they are created or moved into those folders.

## DO

- Keep CLAUDE.md in sync: if a session adds source files, renames modules, or introduces architectural patterns, update the relevant sections before finishing.

## Verification

- After you finish applying any code changes, use the test-writer-vitest agent to write/update unit tests.
- The agent should verify that the tests it writes pass.
- When the tests are done and passing, use the code-review-expert agent and ask it to review the changes done.
- Check with me before applying the fixes/changes suggested by the code-review-expert agent.
- At the end, run `mise exec node -- npm run fix` and fix any warnings or errors that can't be fixed automatically.
- Run `mise exec node -- npm run test:integration:docker` and check that all the tests pass.

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

## Architecture

The plugin registers two vault event handlers in `onload()`:

- **`vault.on('create')`** — fires when a new file is written to disk; triggers rules with `TriggerType = "create"`
- **`vault.on('rename')`** — fires for both renames and moves; cross-folder moves get `TriggerType = "move"`, same-folder renames get `TriggerType = "rename"`

Obsidian has no dedicated `move` event. The distinction between an in-folder rename and a cross-folder move is detected by comparing the parent directory of the new path against the parent of the old path (`isCrossfolderMove` in `utils.ts`).

### Rule Engine

Each `MonitoredFolder` holds an ordered list of `RuleData` objects. When a trigger fires, `RuleEngine.runRules()` iterates rules, evaluates conditions, then dispatches actions. Both conditions and actions are registered in `HandlerRegistry` by type string — adding a new action/condition means implementing the interface and calling `registry.registerAction/Condition` in `createRuleEngine()`.

`FieldDescriptor` objects on each handler drive the settings UI: the Svelte `Actions.svelte` / `Conditions.svelte` components render fields generically based on `fieldType`.

### Adding a new action

1. Create `src/engine/actions/<name>.ts` exporting an `ActionExecutor`
2. Register it in `createRuleEngine()` in `src/engine/rule-engine.ts`
3. Add a constant to `src/constants.ts` only if the type string is referenced outside the executor file

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

### Integration Tests

Run locally with:
```bash
mise exec node -- npm run test:integration
```

Run inside Docker with:
```bash
mise exec node -- npm run test:integration:docker
```

The Docker image uses `COPY` (not a bind mount), so container runs are fully isolated — they cannot overwrite files in your working directory, including the symlinks in `test-vault/.obsidian/plugins/folderer/`.

If those symlinks ever point to `/workspace/...` (a container-only path) instead of your local `dist/main.js`, the plugin will fail to load locally. Fix by re-running the one-time setup commands above.

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
