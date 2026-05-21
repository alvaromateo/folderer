# Move to Property Subfolder

Moves the file into a subfolder whose name is read from a frontmatter property value.

| Parameter | Description |
|-----------|-------------|
| **Property** | The frontmatter property whose string value is used as the subfolder name |

**Example:** With **Property** set to `destination`, a file containing the following frontmatter is moved into `Inbox/books/`:

```yaml
---
destination: books
---
# My Note
```

**Typical uses:**
- Letting note authors self-route files by setting a property during capture
- Deferring the filing decision — write the destination later, then trigger the rule on demand

## Gotchas

**The property value must be a string.** If the property is an array, a number, or a boolean, the action is skipped and the file is not moved.

**The file must have frontmatter.** If there is no frontmatter block, the action is skipped silently.

**The property must exist.** If the named property is absent from the frontmatter, the action is skipped silently.

**The subfolder is relative to the file's current parent.** A value of `archive` on a file at `Inbox/note.md` moves it to `Inbox/archive/note.md`.
