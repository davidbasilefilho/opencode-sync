# opencodedb-cli

Terminal UI for opencodedb built with [OpenTUI](https://github.com/opencode-ai/opentui). Includes a setup wizard, sync status panel, chat worker, and commands for managing sync state.

## Installation

```bash
npm install -g opencodedb-cli
```

## Commands

| Command                               | Description                                                             |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `opencode-sync link`                  | Bind the local client to a self-hosted Convex URL and Sync Security Key |
| `opencode-sync run`                   | Spawn a chat worker, sync cloud state, and load SDK execution plugins   |
| `opencode-sync status`                | Display active sync queues and diagnostic logs                          |
| `opencode-sync divergence-resolution` | Override local configurations to enforce remote cloud states            |

## Requirements

- Node.js >= 22
- A self-hosted Convex deployment with `opencodedb-backend`
