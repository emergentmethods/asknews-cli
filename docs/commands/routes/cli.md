---
title: cli
description: "Manage the AskNews CLI installation"
---

# cli

Manage the AskNews CLI installation

## Commands

### `asknews cli setup`

Install embedded AskNews skills into detected agent directories

**Options:**

| Option | Description |
| --- | --- |
| `--scope <scope>` | global, project, or all Default: `"global"`. |
| `--directory <path>` | project directory Default: `"."`. |
| `--no-agent-skills` | skip agent skill installation |
| `--quiet` | suppress human setup messages |

**Examples:**

```bash
asknews cli setup --scope global
asknews cli setup --scope project --directory .
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
