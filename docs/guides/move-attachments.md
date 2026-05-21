# Move attachments with a note

When you move a note into a new folder, its attachments are left behind in the original location. With **Folderer** you can automate this: the moment a note lands in a monitored folder, all its embedded files are moved into an `Attachments` subfolder right next to it.

## Example setup

Say your vault looks like this:

```
Inbox/
  note.md          ← embeds photo.png and diagram.pdf
  Attachments/
    photo.png
    diagram.pdf
Literature/
```

When you move `note.md` into `Literature/`, you want the result to be:

```
Literature/
  note.md
  Attachments/
    photo.png
    diagram.pdf
```

## Setup

### 1. Add Literature as a monitored folder

Open **Settings → Folderer** and click the add-folder button. Type `Literature` and confirm.

### 2. Add a rule

Inside the _Literature_ section, click **Add rule** and fill in the fields:

| Field | Value |
|-------|-------|
| **Name** | `Carry over attachments` (or any label you like) |
| **Trigger** | `File created` |
| **Conditions** | _(leave empty — applies to every note)_ |

> **Why `File created`?** Moving a note into a monitored folder from a different folder is treated as a creation event by Folderer, so this trigger fires whenever a note arrives in _Literature_ regardless of where it came from.

### 3. Add the action

Click **Add action** and choose **Move Attachments**. Set the **Attachments folder** to `Attachments` (or whatever subfolder name you use for attachments in your vault).

The action moves all embedded files to a subfolder of that name relative to the note's current location — so a note that just landed at `Literature/note.md` will have its attachments placed in `Literature/Attachments/`.

### 4. Save

Click **Save**. The rule is now active.

## Result

From this point on, any note moved into _Literature_ will have its embedded attachments automatically relocated next to it. Using the example above:

```
Literature/
  note.md
  Attachments/
    photo.png
    diagram.pdf
```

Folderer creates the `Attachments` subfolder automatically if it does not exist yet.

## Things to keep in mind

**Only embedded files are moved.** Folderer reads Obsidian's embed list, which means only files referenced with `![[file]]` syntax are picked up. Plain wikilinks (`[[file]]`) and markdown links (`[label](file)`) are ignored.

**Conflicts are skipped, not overwritten.** If a file with the same name already exists in `Literature/Attachments/`, Folderer shows a notice and leaves the original untouched.

**The attachment folder name should match across your vault.** If some notes use `Assets` and others use `Attachments`, set the action's folder name to match the convention you actually use, or add separate rules for each name.
