# opencodedb-backend

[Convex](https://www.convex.dev/) backend for opencodedb with persistent text streaming, action caching, LLM response caching, and API key management.

## Installation

```bash
npm install opencodedb-backend
```

## Usage

```bash
npx convex deploy
```

## Components

- **Persistent Text Streaming** (`@convex-dev/persistent-text-streaming`) — crash-resilient LLM interaction streams
- **Action Cache** (`@convex-dev/action-cache`) — action result caching
- **LLM Cache** (`@mzedstudio/llm-cache`) — LLM response deduplication
- **API Keys** (`@00akshatsinha00/convex-api-keys`) — sync security key management

## Files

The package ships both compiled output (`dist/`) and Convex function source (`convex/`) so the Convex CLI can deploy them directly.
