# File Name Condition

Checks the name of the file (including its extension).

**Example:** File name *contains* `meeting` — matches `2024-01-15 meeting notes.md`

## Available Operators

All condition types share the same set of string operators:

| Operator | Description |
|----------|-------------|
| **exists** | True if the value is present (non-empty). No extra input needed. |
| **contains** | True if the value includes the given string |
| **starts with** | True if the value begins with the given string |
| **ends with** | True if the value ends with the given string |
| **matches regex** | True if the value matches the given regular expression |

Operators are case-sensitive. For case-insensitive matching, use the *matches regex* operator with the `(?i)` flag (e.g. `(?i)meeting`).
