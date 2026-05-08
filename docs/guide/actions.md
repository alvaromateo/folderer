# Actions

Actions are the operations Folderer executes on a file when all of a rule's conditions are satisfied. A rule must have at least one action, and you can chain multiple actions in a single rule.

Actions are performed using Obsidian's `vault.process()` API, which is an atomic read-modify-write operation that prevents race conditions.

## Append Text

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

## Prepend Text

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

## Multiple Actions per Rule

You can add multiple actions to a single rule. They execute in order, so the output of one action feeds into the next. For instance, you could prepend a YAML frontmatter block and then append a footer tag in the same rule.

To add another action, click **Add action** in the rule modal.
