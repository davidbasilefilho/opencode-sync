# opencodedb

Sync and execution plugin for [OpenCode](https://github.com/opencode-ai/opencode). Provides local-first, crash-resilient multi-device workflows through self-hosted [Convex](https://www.convex.dev/) backends.

## Architecture

Monorepo with four packages:

| Package              | Description                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `opencodedb-types`   | Shared Zod schemas and TypeScript types for threads, messages, attachments, machine profiles, and configuration                                 |
| `opencodedb-backend` | Convex backend with persistent text streaming, action caching, LLM response caching, and API key management                                     |
| `opencodedb-plugin`  | OpenCode SDK plugin that hooks into lifecycle events for session sync and local tool delegation                                                 |
| `opencodedb-cli`     | Terminal UI built with OpenTUI -- setup wizard, sync status panel, chat worker, and commands (`link`, `run`, `status`, `divergence-resolution`) |

## Core Concepts

**Local-First by Default.** The sync layer runs fully offline -- threads, configs, and attachments live locally. An opt-in cloud bridge connects devices through a private Convex instance.

**Crash-Resilient Streaming.** LLM interactions route through Convex actions using persistent text streaming. If a client disconnects mid-tool-execution, the session state persists on the backend. On reconnection, the client detects the dangling state, finishes the pending tool, and resumes the stream.

**Reconciliation Sync.** Offline mutations are buffered locally with pending or dirty flags. When the connection is restored, changes are batched and pushed to reconcile cloud and client state.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.4
- Node.js >= 22 (for full compatibility)
- A self-hosted [Convex](https://www.convex.dev/) deployment

## Getting Started

```bash
# Install dependencies
bun install

# Deploy the Convex backend
cd packages/backend
npx convex deploy

# Link your CLI to the backend
bun run opencode-sync link

# Start a sync session
bun run opencode-sync run
```

## CLI Commands

| Command                 | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `link`                  | Bind the local client to a self-hosted Convex URL and Sync Security Key |
| `run`                   | Spawn a chat worker, sync cloud state, and load SDK execution plugins   |
| `status`                | Display active sync queues and diagnostic logs                          |
| `divergence-resolution` | Override local configurations to enforce remote cloud states            |

## Development

```bash
# Install workspace dependencies
bun install

# Build all packages
bun run build

# Run tests across all packages
bun run test

# Lint and format
bun run check
```

## Stack

- [Bun](https://bun.sh/) -- runtime and package manager
- [TypeScript](https://www.typescriptlang.org/) with strict mode
- [Convex](https://www.convex.dev/) -- reactive backend with real-time sync
- [OpenCode SDK](https://github.com/opencode-ai/opencode) -- plugin interface
- [OpenTUI](https://github.com/opencode-ai/opentui) -- terminal UI framework
- [Zod](https://zod.dev/) -- runtime schema validation
- [Turborepo](https://turbo.build/repo) -- monorepo orchestration
- [Vitest](https://vitest.dev/) -- testing
- [oxlint](https://oxc.rs/) / [oxfmt](https://oxc.rs/) -- linting and formatting

## License

Apache 2.0 -- see [LICENSE](LICENSE).
