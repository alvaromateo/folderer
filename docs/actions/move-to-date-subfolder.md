# Move to Date Subfolder

Moves the file into a subfolder named after the current date, created inside the file's current folder.

| Parameter | Description |
|-----------|-------------|
| **Date pattern** | Template for the subfolder name using date tokens (default: `MM-YYYY`) |

## Date Tokens

| Token | Output | Example (May 3, 2025) |
|-------|--------|-----------------------|
| `YYYY` | Four-digit year | `2025` |
| `YY` | Two-digit year | `25` |
| `MM` | Zero-padded month (01–12) | `05` |
| `M` | Month without padding (1–12) | `5` |
| `DD` | Zero-padded day (01–31) | `03` |
| `D` | Day without padding (1–31) | `3` |

Tokens can be combined freely with any separator characters.

**Example patterns** (evaluated on May 3, 2025):

| Pattern | Subfolder |
|---------|-----------|
| `MM-YYYY` | `05-2025` |
| `YYYY-MM-DD` | `2025-05-03` |
| `YYYY` | `2025` |

**Typical uses:**
- Sorting inbox notes by month as they arrive
- Grouping captures by year

## Gotchas

**The subfolder is relative to the file's current parent.** A file at `Inbox/note.md` with pattern `05-2025` is moved to `Inbox/05-2025/note.md`.

**Leading and trailing slashes are stripped.** A pattern that resolves to `/05-2025/` behaves the same as `05-2025`.

**If the pattern resolves to an empty string**, the action is skipped and the file is not moved.
