# Property Condition

Checks the value of a frontmatter property in the file.

You specify the **property name** (e.g. `status`) and the operator is applied to its value.

**Example:** Property `status` *contains* `draft` — matches files where `status: draft` (or `status: draft review`)

> The property condition reads frontmatter from Obsidian's metadata cache. If the file has no frontmatter or the property is absent, the condition evaluates to false (except for the *exists* operator).

## Available Operators

All condition types share the same set of string operators:

| Operator | Description |
|----------|-------------|
| **exists** | True if the value is present (non-empty). No extra input needed. |
| **contains** | True if the value includes the given string |
| **starts with** | True if the value begins with the given string |
| **ends with** | True if the value ends with the given string |
| **matches regex** | True if the value matches the given regular expression |

Operators are case-sensitive. For case-insensitive matching, use the *matches regex* operator with the `(?i)` flag.
