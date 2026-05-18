# Condition Groups

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

If no conditions are configured on a rule, it matches every file that triggers it.
