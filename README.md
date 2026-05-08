# Folderer

An [Obsidian](https://obsidian.md/) plugin that automatically runs rules on markdown files in monitored folders.

**[Documentation →](https://alvaromateo.github.io/folderer/)**

## Features

- **Monitored folders** — designate any vault folder as a watched location
- **Rule engine** — attach multiple rules to each folder, each with its own trigger, conditions, and actions
- **Triggers** — fire on file creation or in-folder rename/move
- **Conditions** — filter by file name, file path, or frontmatter property using operators: *contains*, *starts with*, *ends with*, *matches regex*, and *exists*
- **Condition groups** — combine conditions with **All**, **Any**, or **None** logic
- **Actions** — append or prepend text to a file automatically
- **Multiple actions per rule** — chain several actions in a single rule
- **Rule ordering** — reorder rules with up/down buttons to control execution sequence

## Installation

1. Open Obsidian → **Settings → Community Plugins**
2. Click **Browse** and search for **Folderer**
3. Install and enable the plugin

## Quick Start

1. Open **Settings → Folderer**
2. Add a monitored folder (e.g. `Literature`)
3. Create a rule for that folder:
   - **Trigger**: File created
   - **Action**: Append text → `#literature`
4. Create a `.md` file inside `Literature/` — `#literature` is appended automatically

See the [full documentation](https://alvaromateo.github.io/folderer/) for all available conditions and actions.

## Development

Requires [mise](https://mise.jdx.dev/) for Node.js management.

```bash
git clone https://github.com/alvaromateo/folderer.git
cd folderer
npm install
npm run dev       # watch mode — rebuilds on save
npm test          # unit tests
```

Open Obsidian on `./test-vault/` and enable Folderer under Community Plugins.

## License

[MIT](LICENSE) © Alvaro Mateo
