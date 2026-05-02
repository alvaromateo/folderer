---
name: obsidian-reference
description: Use this skill when writing code for an Obsidian plugin feature; it allows to reference APIs quickly, suggest patterns, catch gotchas, debug issues, and help with testing.
---

# Obsidian Plugin Development Guide

## Quick Reference

**Project Type:** TypeScript Obsidian Plugin  
**Base Class:** Extends `Plugin` (which extends `Component`)  
**Key APIs:** Vault, Workspace, MetadataCache, App  
**Lifecycle:** `onload()` → register extensions → `onunload()` → automatic cleanup

---

## Core Concepts

### Plugin Lifecycle

```typescript
export default class MyPlugin extends Plugin {
  async onload() {
    // Register commands, views, event handlers, and UI elements
    // Called when the plugin loads
  }

  async onunload() {
    // Cleanup happens automatically via Component lifecycle
    // You typically don't need to do anything here
  }
}
```

**Key Pattern:** Register everything in `onload()`. The Component base class automatically cleans up registered handlers and listeners via `onunload()`.

### Component Lifecycle & Automatic Cleanup

- `registerEvent()` — Register event listeners that auto-detach on unload
- `registerInterval()` — Register intervals that auto-clear on unload
- `registerDomEvent()` — Register DOM events that auto-remove on unload
- `addChild()` — Add child components for hierarchical cleanup

**Why it matters:** This prevents memory leaks and orphaned handlers. Don't manually clean up in `onunload()` unless you've done something outside the standard registration methods.

---

## Key APIs

### Vault API
Access files and folders in the vault.

```typescript
// File operations
const file = this.app.vault.getAbstractFileByPath('path/to/file.md');
const content = await this.app.vault.read(file as TFile);
await this.app.vault.modify(file as TFile, newContent);
await this.app.vault.create('path/to/new.md', 'content');

// Events
this.registerEvent(this.app.vault.on('create', (file) => { }));
this.registerEvent(this.app.vault.on('modify', (file) => { }));
this.registerEvent(this.app.vault.on('delete', (file) => { }));
```

### Workspace API
Interact with panes and the UI.

```typescript
// Get active file
const activeFile = this.app.workspace.getActiveFile();

// Get active leaf (pane)
const leaf = this.app.workspace.activeLeaf;

// Create new leaf
const newLeaf = this.app.workspace.createLeafInParent(
  this.app.workspace.rootSplit,
  'split',
  0
);

// Register event
this.registerEvent(this.app.workspace.on('file-open', (file) => { }));
```

### MetadataCache API
Access cached metadata about markdown files (headings, links, embeds, tags, blocks).

```typescript
// Get metadata for a file
const metadata = this.app.metadataCache.getFileCache(file as TFile);

// Access specific metadata
metadata?.headings?.forEach(heading => {
  console.log(heading.level, heading.heading);
});

metadata?.links?.forEach(link => {
  console.log(link.link, link.original);
});

// Listen for metadata changes
this.registerEvent(
  this.app.metadataCache.on('changed', (file) => { })
);
```

---

## Common Patterns

### Registering Commands

```typescript
this.addCommand({
  id: 'my-command-id',
  name: 'My Command',
  callback: () => {
    console.log('Command executed');
  },
  hotkey: {
    modifiers: ['Ctrl', 'Shift'],
    key: 'p'
  }
});
```

### Creating Settings Tab

```typescript
this.addSettingTab(new MySettingTab(this.app, this));

class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const {containerEl} = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Setting name')
      .setDesc('Setting description')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.myOption)
        .onChange(async (value) => {
          this.plugin.settings.myOption = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

### Registering Event Handlers

```typescript
// File events (use registerEvent for auto-cleanup)
this.registerEvent(this.app.vault.on('create', (file) => {
  if (file instanceof TFile) {
    console.log('File created:', file.path);
  }
}));

// Workspace events
this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
  console.log('Active file changed');
}));

// Editor events
this.registerEvent(this.app.workspace.on('editor-change', (editor, info) => {
  console.log('Editor content changed');
}));
```

### Creating Custom Views

```typescript
const VIEW_TYPE_CUSTOM = 'custom-view';

class CustomView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_CUSTOM;
  }

  getDisplayText() {
    return 'Custom View';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { text: 'View content' });
  }
}

// Register in onload()
this.registerView(VIEW_TYPE_CUSTOM, (leaf) => new CustomView(leaf));
this.addRibbonIcon('dice', 'Open custom view', () => {
  this.app.workspace.getLeaf().setViewState({
    type: VIEW_TYPE_CUSTOM,
    active: true,
  });
});
```

---

## Testing Patterns

### Unit Tests with Vitest

```typescript
// test/my-plugin.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import MyPlugin from '../src/main';

describe('MyPlugin', () => {
  let plugin: MyPlugin;

  beforeEach(() => {
    plugin = new MyPlugin(null as any); // Mock app as needed
  });

  it('should load without errors', async () => {
    await plugin.onload();
    expect(plugin).toBeDefined();
  });

  it('should handle file creation', async () => {
    // Test file event handlers
  });
});
```

### E2E Tests with Playwright (if testing UI interactions)

```typescript
// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

test('plugin command executes', async ({ page }) => {
  // Navigate to Obsidian vault
  // Trigger command
  // Assert results
});
```

---

## Best Practices

1. **Always use `registerEvent()`** for event listeners — ensures cleanup on unload
2. **Use `registerInterval()`** for intervals — auto-clear on unload
3. **Type-guard `TFile`** when working with files — not all AbstractFile objects are TFile
4. **Lean on MetadataCache** — don't parse markdown manually when cache has what you need
5. **Async safety** — mark functions as `async` when calling `await`; handle errors in event handlers
6. **Settings persistence** — always call `this.saveSettings()` after modifying settings
7. **Don't touch DOM directly** — use Obsidian's UI components (Setting, Modal, Notice, etc.)
8. **Test event flows** — file operations, workspace changes, and metadata updates are critical paths

---

## Common Gotchas

| Issue | Solution |
|-------|----------|
| Memory leaks from unregistered listeners | Always use `registerEvent()` |
| Settings don't persist | Call `this.saveSettings()` after changes |
| Files not found in Vault | Use `getAbstractFileByPath()` instead of manual string matching; check `instanceof TFile` |
| Type errors with AbstractFile | Type-guard: `if (file instanceof TFile) { ... }` |
| Metadata cache outdated | Listen to `metadataCache.on('changed')` and update your state |
| DOM events not cleaning up | Use `registerDomEvent()` instead of direct `addEventListener()` |

---

## Development Setup

- **Template:** https://github.com/obsidianmd/obsidian-sample-plugin
- **Type Defs:** Install `obsidian` and `@types/obsidian` as dependencies
- **Build:** `npm run dev` for development with hot reload
- **Manifest:** `manifest.json` — update version, name, author before each release
- **Styles:** `.css` files loaded automatically from root; scoped to plugin via `.your-plugin-class` wrapper

---

## Resources

- **Obsidian API Docs:** https://docs.obsidian.md/
- **API Reference:** https://github.com/obsidianmd/obsidian-api
- **Sample Plugin:** https://github.com/obsidianmd/obsidian-sample-plugin
- **Community Plugins:** https://obsidian.md/plugins

---

## Debugging Tips

```typescript
// Console logging (visible in DevTools)
console.log('Debug info:', this.app.vault.getRoot());

// Open DevTools in Obsidian
// Ctrl+Shift+I (Windows) or Cmd+Option+I (Mac)

// Check settings values
console.log(this.settings);

// Verify event registration
// Look for error messages in console about failed registrations
```
