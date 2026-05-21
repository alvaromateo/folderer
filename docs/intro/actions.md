# Actions

An action is an operation Folderer performs on a file when a rule fires. Each rule can have one or more actions; they run sequentially in the order they are listed.

## Available Actions

| Action | Description |
|--------|-------------|
| [**Append Text**](/actions/append-text) | Adds text to the end of the file |
| [**Prepend Text**](/actions/prepend-text) | Adds text to the beginning of the file |
| [**Move to Date Subfolder**](/actions/move-to-date-subfolder) | Moves the file into a subfolder named after the current date |
| [**Move to Property Subfolder**](/actions/move-to-property-subfolder) | Moves the file into a subfolder taken from a frontmatter property |
| [**Move Attachments**](/actions/move-attachments) | Moves all embedded attachments into a subfolder next to the note |

## Execution Order

Actions within a rule run sequentially in the order they are listed. Reorder them using the arrow buttons inside the rule modal.

Order matters when:
- One action moves a file that a subsequent action also targets
- One action modifies a frontmatter property that a subsequent action reads

## Common Behaviors

**Text modifications are atomic.** Append Text and Prepend Text use Obsidian's `vault.process()` API, which performs an atomic read-modify-write. This prevents data loss when the same file is modified by multiple rules or external processes simultaneously.

**Move actions create folders automatically.** If the destination subfolder does not exist, it is created before the file is moved.

**Move actions skip no-ops.** If the file is already at the target location, the move is skipped silently.

**Attachment conflicts show a notice.** If Move Attachments finds an attachment that already exists at the destination path, it skips that file and shows an Obsidian notice instead of overwriting.
