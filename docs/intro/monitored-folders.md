# Monitored Folders

## Overview

A **monitored folder** is a vault folder that Folderer watches for file events. Each monitored folder has its own list of rules that are evaluated independently when a matching event occurs inside that folder.

Only the **direct** monitored path is watched — files in subfolders are included as long as their path starts with the monitored folder path.

## Adding a Folder

1. Open **Settings → Folderer**
2. Click the add-folder button
3. Enter the vault-relative path (e.g. `Literature` or `Projects/Active`)
4. Press Enter or click Confirm

The new folder section appears immediately in the settings panel with an empty rules list.

## Removing a Folder

Each folder section has a delete button (trash icon) in its header. Clicking it removes the folder and **all of its rules** permanently.

## Folder Scoping

Rules are scoped to the folder they belong to. If you have two monitored folders — `Literature` and `Projects` — their rules are completely independent:

- A file arriving in `Literature` only triggers rules in the `Literature` section
- A file arriving in `Projects` only triggers rules in the `Projects` section

This lets you apply different automation to different areas of your vault without any rule bleeding between them.

## Multiple Folders

You can add as many monitored folders as you like. Each folder is displayed as a collapsible section in the settings panel. Rules inside each section can be reordered independently.
