# Getting Started

## What is Folderer?

Folderer is an Obsidian plugin that watches folders in your vault for file events. When a markdown file is created in — or moved into — a monitored folder, Folderer evaluates a set of user-defined rules and runs the matching ones automatically.

A typical use case: every note that lands in your `Literature` folder should have `#literature` appended to it. With Folderer, this happens the moment the file arrives, without any manual step.

## Installation

### Community Plugins (recommended)

1. Open Obsidian and go to **Settings → Community Plugins**
2. Disable Safe Mode if prompted
3. Click **Browse** and search for **Folderer**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the [latest release](https://github.com/alvaromateo/folderer/releases/latest) assets: `main.js` and `manifest.json`
2. Create the folder `<vault>/.obsidian/plugins/folderer/`
3. Copy both files into that folder
4. Reload Obsidian and enable Folderer under **Settings → Community Plugins**

## First Steps

Once the plugin is enabled, open **Settings → Folderer** to configure it.

### 1. Add a monitored folder

Click the **folder icon** (or the add button) and type the path of a vault folder you want to watch, such as `Literature`.

### 2. Create a rule

Inside that folder's section, click **Add rule**. A modal opens where you configure:

| Field | Description |
|-------|-------------|
| **Name** | A label for the rule (e.g. "Tag as literature") |
| **Trigger** | When the rule fires — see [Triggers](./rules#triggers) |
| **Conditions** | Optional filters the file must satisfy |
| **Actions** | What to do when the rule matches |

### 3. Test it

Create a `.md` file inside the monitored folder. If you set up an *Append text* action with the text `#literature`, that tag will appear at the bottom of the file immediately.

## Next Steps

- [Monitored Folders](./monitored-folders) — how folder scoping works
- [Rules](./rules) — triggers, ordering, and enabling/disabling
- [Conditions](/conditions/file-name) — all available filters
- [Actions](/actions/append-text) — all available actions
