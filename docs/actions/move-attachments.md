# Move Attachments

Moves all non-note files embedded in the current note into a subfolder next to it.

| Parameter | Description |
|-----------|-------------|
| **Attachments folder** | Name of the subfolder where attachments are placed (default: `Attachments`) |

**Example:** A note at `Inbox/meeting.md` that embeds `photo.png` and `diagram.pdf`. With the default folder name, both files are moved to `Inbox/Attachments/`.

**Typical uses:**
- Keeping a note and all its assets co-located after the note is filed

## Gotchas

**Only embedded files are moved, not wikilinks.** The action reads Obsidian's embed list — files referenced with `![[file]]` syntax. Plain links (`[[file]]` or `[label](file)`) are ignored.

**Markdown notes are skipped.** If an embed resolves to a `.md` file, it is not moved.

**Duplicate embeds are deduplicated.** If the same attachment is embedded more than once, it is moved only once.

**Conflicts skip and show a notice.** If a file with the same name already exists at the destination, Folderer shows an Obsidian notice and leaves the original file untouched. No files are overwritten.

**The folder is relative to the note's current location.** A note at `Projects/report.md` with folder name `Attachments` will place files in `Projects/Attachments/`, not at the vault root.
