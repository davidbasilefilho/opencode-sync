# opencodedb-types

Shared Zod schemas and TypeScript types for opencodedb: threads, messages, attachments, machine profiles, and configuration.

## Installation

```bash
npm install opencodedb-types
```

## Usage

```typescript
import { ThreadSchema, MessageSchema } from "opencodedb-types";

const thread = ThreadSchema.parse({
  id: "abc123",
  title: "My Thread",
  createdAt: Date.now(),
});
```

## Contents

- Thread, message, and attachment schemas
- Machine profile types
- Configuration schemas
- OpenCode session metadata types

All schemas use [Zod](https://zod.dev/) for runtime validation and TypeScript inference.
