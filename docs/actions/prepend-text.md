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
