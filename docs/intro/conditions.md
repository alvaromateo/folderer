# Conditions

Conditions are optional filters attached to a rule. When present, they must all be satisfied for the rule's actions to run. If a rule has no conditions, it matches every file that triggers it.

## Available Conditions

| Condition | Checks |
|-----------|--------|
| [**File Name**](/conditions/file-name) | The file name, including its extension |
| [**File Path**](/conditions/file-path) | The full vault-relative path of the file |
| [**Property**](/conditions/property) | A frontmatter property value |

## String Operators

All condition types share the same set of operators:

| Operator | Description |
|----------|-------------|
| **exists** | True if the value is non-empty. No comparison input needed. |
| **contains** | True if the value includes the given string |
| **starts with** | True if the value begins with the given string |
| **ends with** | True if the value ends with the given string |
| **matches regex** | True if the value matches the given regular expression |

Operators are **case-sensitive**. For case-insensitive matching, use *matches regex* with the `(?i)` flag — for example, `(?i)meeting` matches `Meeting`, `MEETING`, and `meeting`.

> **Invalid regex:** If a condition contains a malformed regular expression, evaluation throws an error and the rule stops processing that file.

## Condition Groups

Conditions are organised into a **root group** that determines how they are combined:

| Group type | Behaviour |
|------------|-----------|
| **All** | Every condition in the group must be true (logical AND) |
| **Any** | At least one condition must be true (logical OR) |
| **None** | No condition in the group must be true (logical NOT/NOR) |

If a group itself contains no conditions, it evaluates to true and has no effect on the rule.
