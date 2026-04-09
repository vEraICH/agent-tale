---
description: Set the VRA Lab build number (CalVer). Usage: /vra-lab-set-ver 20260409.1
---

Update the VRA Lab build number to `$ARGUMENTS`.

Steps:
1. Validate the argument matches CalVer format `vYYYYMMDD.Rev` (optional `v` prefix + 8-digit date + dot + integer). If it doesn't match, tell the user and stop. If the argument is missing the `v` prefix, add it automatically before proceeding.
2. Read `sites/vra-lab/src/build.ts` and show the current value.
3. Update the `BUILD_NO` value to `$ARGUMENTS`.
4. Confirm the change: "Build number updated: {old} → {new}".

Do not commit. The user will review and commit manually.
