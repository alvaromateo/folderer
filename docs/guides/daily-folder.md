# Daily folder

If you want to order the notes in folders by the day they were created you can use **Folderer** to do this automatically!

Let's say you want all your notes created in a folder; I'll call it _Inbox_. But you don't want to have them all dangling around
and instead you'd like to have them ordered by the day they were created. How would you do that?

## Setup

### 1. Add Inbox as a monitored folder

Open **Settings → Folderer** and click the add-folder button. Type `Inbox` and confirm.

### 2. Add a rule

Inside the _Inbox_ section, click **Add rule** and fill in the fields:

| Field | Value |
|-------|-------|
| **Name** | `Sort into daily folder` (or any label you like) |
| **Trigger** | `File created` |
| **Conditions** | _(leave empty — applies to every note)_ |

> **Tip:** The `File created` trigger also fires when a file is **moved into** _Inbox_ from another folder, so notes you drag in are sorted automatically too.

### 3. Add the action

Click **Add action** and choose **Move to Date Subfolder**. Set the **Date pattern** to the format you want for the subfolder name.

Common choices:

| Pattern | Subfolder (example: May 21, 2026) |
|---------|-----------------------------------|
| `YYYY-MM-DD` | `2026-05-21` |
| `MM-YYYY` | `05-2026` _(default)_ |
| `YYYY` | `2026` |

### 4. Save

Click **Save**. The rule is now active.

## Result

From this point on, any note created inside _Inbox_ is immediately moved into a subfolder named after the current date. For example, with the `YYYY-MM-DD` pattern, a note created on May 21, 2026 ends up at:

```
Inbox/2026-05-21/my-note.md
```

Folderer creates the subfolder automatically if it does not exist yet.
