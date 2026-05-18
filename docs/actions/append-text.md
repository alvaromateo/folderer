# Append Text

Appends the specified text to the **end** of the file, preceded by a newline.

| Parameter | Description |
|-----------|-------------|
| **Text** | The string to append |

**Example:** Appending `#literature` to a file whose current content is `# My Note` produces:

```
# My Note
#literature
```

**Typical uses:**
- Adding tags when a note enters a folder
- Stamping a footer line or signature
- Marking notes with a source label

## How actions are executed

Actions are performed using Obsidian's `vault.process()` API, which is an atomic read-modify-write operation that prevents race conditions.

A single rule can execute several actions in sequence. Add additional actions by clicking **Add action** inside the rule modal. Actions within a rule run in the order they are listed.
