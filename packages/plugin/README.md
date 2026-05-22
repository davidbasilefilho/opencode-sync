# opencodedb-plugin

[OpenCode SDK](https://github.com/opencode-ai/opencode) plugin that hooks into lifecycle events for session sync and local tool delegation.

## Installation

```bash
npm install opencodedb-plugin
```

## Usage

```typescript
import { createSyncPlugin } from "opencodedb-plugin";

const plugin = createSyncPlugin({
  backendUrl: "https://your-convex-instance.convex.cloud",
});
```

## How it works

The plugin registers lifecycle hooks in OpenCode to:

- Sync session state to a self-hosted Convex backend
- Buffer offline mutations with pending/dirty flags
- Reconcile cloud and client state on reconnection
- Persist LLM interaction streams across disconnections

Requires an `opencodedb-backend` deployment and types from `opencodedb-types`.
