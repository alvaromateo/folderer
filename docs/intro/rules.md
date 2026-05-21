# Rules

## Anatomy of a Rule

Every rule has the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | Yes | Human-readable label shown in the settings list |
| **Enabled** | — | Toggle to temporarily disable a rule without deleting it |
| **Trigger** | Yes | The file event that activates this rule |
| **Conditions** | No | Optional filters — if present, all/any/none must match |
| **Actions** | Yes | One or more operations to execute on the file |

## Triggers

A trigger defines which event causes a rule to be evaluated.

| Trigger | When it fires |
|---------|--------------|
| **File created** | A new markdown file is written into the monitored folder |
| **File renamed** | A markdown file already inside the folder is renamed (not moved) |
| **File moved**   | A markdown file inside the folder is moved |
| **File deleted** | A markdown file inside the monitored folder is removed |

> **Note on moves:** When a file is moved *into* a monitored folder from a different folder, Folderer treats it as a **File created** event. Moving a file out of a folder does not trigger any rule.

## Creating a Rule

1. Expand a monitored folder section in **Settings → Folderer**
2. Click **Add rule**
3. Fill in the name and select a trigger
4. Optionally configure conditions (see [Conditions](/conditions/file-name))
5. Add one or more actions (see [Actions](/actions/append-text))
6. Click **Save**

The rule appears in the folder's rule list and is enabled by default.

## Enabling and Disabling Rules

Each rule row has an enable/disable toggle. Disabled rules are skipped entirely during evaluation — useful for temporarily suspending automation without losing the rule configuration.

## Rule Ordering

Rules are evaluated **top to bottom** in the order they appear in the list. Use the **up** and **down** arrow buttons on each rule row to reorder them.

Rule ordering matters when:

- Multiple rules match the same file
- A later rule depends on changes made by an earlier one (e.g. one rule appends a tag, the next checks the file name)

## Multiple Actions per Rule

A single rule can execute several actions in sequence. Add additional actions by clicking **Add action** inside the rule modal. Actions within a rule run in the order they are listed.

## Deleting a Rule

Click the trash icon on a rule row to delete it. This action is permanent.
