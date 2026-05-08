# Conditions

Conditions let you filter which files a rule applies to. If no conditions are configured, the rule matches every file that triggers it.

## Condition Types

### File Name

Checks the name of the file (including its extension).

**Example:** File name *contains* `meeting` — matches `2024-01-15 meeting notes.md`

### File Path

Checks the full vault-relative path of the file.

**Example:** File path *starts with* `Projects/Active` — matches any file in that subtree

### Property

Checks the value of a frontmatter property in the file.

You specify the **property name** (e.g. `status`) and the operator is applied to its value.

**Example:** Property `status` *contains* `draft` — matches files where `status: draft` (or `status: draft review`)

> The property condition reads frontmatter from Obsidian's metadata cache. If the file has no frontmatter or the property is absent, the condition evaluates to false (except for the *exists* operator).

## Operators

All condition types use the same set of string operators:

| Operator | Description |
|----------|-------------|
| **exists** | True if the value is present (non-empty). No extra input needed. |
| **contains** | True if the value includes the given string |
| **starts with** | True if the value begins with the given string |
| **ends with** | True if the value ends with the given string |
| **matches regex** | True if the value matches the given regular expression |

Operators are case-sensitive. For case-insensitive matching, use the *matches regex* operator with the `(?i)` flag (e.g. `(?i)meeting`).

## Condition Groups

Conditions are organised into a **root group** that determines how they are combined:

| Group type | Behaviour |
|------------|-----------|
| **All** | Every condition in the group must be true (logical AND) |
| **Any** | At least one condition must be true (logical OR) |
| **None** | No condition in the group must be true (logical NOT/NOR) |

You can nest groups inside each other for complex logic.

**Example:** A rule that should match files named `journal` that are NOT tagged `archived`:

```
All
├── File name  contains  "journal"
└── None
    └── Property "tags"  contains  "archived"
```
