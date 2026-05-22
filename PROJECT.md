# opencode-sync

Terminal-native sync and execution plugin for OpenCode (Zig/OpenTUI). Uses official OpenCode SDK and user-hosted Convex instances for local-first, crash-resilient multi-device workflows.

## Workspace Architecture

- **Default Local-First:** Runs offline; stores threads, configs, and attachments locally.
- **Opt-In Cloud Bridge:** Scales runtime across environments without a central broker or web UI.
- **Self-Hosted Ownership:** Users clone project, deploy private Convex backend, and link clients via Setup Sync TUI using custom Convex URL and Sync Security Key (API Key).
- **OpenCode SDK Integration:** Hooks into client lifecycle events (message creation, session idle) for database sync and local tool delegation.

## Offline-First Execution & Reconnection Sync

Resilient fallback ensuring uninterrupted offline operation:

- **Offline Capability:** Auto-enters local-only execution if Convex is unreachable. Users can create threads, prompt agents, and execute local tools without operational blocks.
- **Local Mutation Buffering:** Saves offline database mutations, histories, and attachments locally under a pending status or dirty flag.
- **Reconciliation Push:** Auto-detects re-established Convex connections, then sequentially processes, batches, and pushes local updates to align cloud and client states.

## Core Execution Mechanics

```text
Client TUI (Laptop/PC) <---> Sync and States <---> Private Convex Database
          |                                                 |
Local SDK Execution                                   Convex Actions
          |                                                 |
Local Filesystem Shell                                LLM Provider API
```

### 1. Zero-UI Synchronization

- **Handshake:** Client matches local profiles against the remote Convex URL on boot.
- **Pull Vector:** Fetches missing remote sessions locally to instantiate the workspace.
- **Push Vector:** Upserts un-synced/pending local sessions to Convex.
- **Context Routing:** Employs hardware-based machine IDs for system-specific paths and commands.

### 2. Transactional Streaming & Crash-Proof Tooling

Requests route through Convex actions using transactional text-streaming to prevent state loss during client dropouts:

- **Normal Loop:** Streaming LLM tokens write to Convex -> state transitions to `awaiting tool` -> client executes tool locally -> uploads output mutation -> triggers next LLM turn.
- **Crash Resilience:** If a client crashes during tool execution, session freezes at `awaiting tool` on Convex. On next TUI connection, the client scans for these dangling states, auto-executes the pending tool locally, uploads results, and resumes the stream.

## Schema Design (Conceptual)

- **Threads:** Title, creation timestamp, last active machine identifier, storage root directory, enabled SDK plugins configuration JSON.
- **Messages:** Parent thread reference, sender role (user/assistant/system), text buffer, status (streaming, awaiting tool, tool executing, completed, failed), tool metadata (call ID, name, raw argument JSON), tool result text, assigned machine owner.
- **Attachments:** Parent thread/message references, Convex Storage file ID, original file name, MIME type.

## Transition Mutations & Recovery Protocols

### State Mutations

- **Start Stream:** Transitions status to `streaming` and initiates real-time text accumulation.
- **Yield to Tool:** Parses tool call structure from stream, freezes progress at `awaiting tool`, and sets target machine owner.
- **Submit Result:** Transitions status to `tool executing`, commits local tool outputs, and initiates the next LLM call block.

### Error Mitigations

- **Network Interruptions:** TUI reconnects and catches up via Convex subscription buffers while the backend continues compiling streaming text.
- **Directory Divergence:** Paths are dynamically mapped using system profiles relative to the active machine's designated storage root path.
- **Deadlock Prevention:** Background cron job scans for tasks stuck in `awaiting`/`executing` states for >10 minutes, forcing a transition to `failed` for manual TUI intervention.

## CLI & System Features

- **link:** Bind local client to a self-hosted Convex URL and API Key.
- **run:** Spawn chat worker, sync cloud state, and load SDK execution plugins.
- **status:** Display active worker sync queues and diagnostic logs.
- **divergence-resolution:** Override local configurations to enforce remote cloud states.

## Roadmap

- **Local Concurrency Controls:** Use directory lock files to prevent dual agent execution on identical working trees.
- **Encrypted Payloads:** Apply local keypair signatures to DB transactions to secure tool parameters from third-party viewing.
- **Chunk Buffering:** Group tiny token sequences over weak connections to optimize socket performance.

```

```
