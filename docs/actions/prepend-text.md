# Prepend Text

Prepends the specified text to the **beginning** of the file, followed by a newline.

| Parameter | Description |
|-----------|-------------|
| **Text** | The string to prepend |

**Example:** Prepending `status: inbox` to a file produces:

```
status: inbox
# My Note
```

**Typical uses:**
- Injecting a frontmatter property draft at the top
- Adding a processing header before content is reviewed

## How actions are executed

Actions are performed using Obsidian's `vault.process()` API, which is an atomic read-modify-write operation that prevents race conditions.

A single rule can execute several actions in sequence. Add additional actions by clicking **Add action** inside the rule modal. Actions within a rule run in the order they are listed.
