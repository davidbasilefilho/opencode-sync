#!/usr/bin/env bun
import { divergenceResolutionCommand } from "./commands/divergence-resolution.js";
import { linkCommand } from "./commands/link.js";
import { runCommand } from "./commands/run.js";
import { statusCommand } from "./commands/status.js";

const command = process.argv[2] ?? "help";

switch (command) {
  case "link": {
    await linkCommand();
    break;
  }
  case "run": {
    await runCommand();
    break;
  }
  case "status": {
    await statusCommand();
    break;
  }
  case "divergence-resolution": {
    await divergenceResolutionCommand();
    break;
  }
  case "help":
  default: {
    console.log(`
opencode-sync - Sync layer for OpenCode sessions

Usage:
  opencode-sync link                    Set up sync configuration
  opencode-sync run                     Start the sync worker
  opencode-sync status                  Show current sync status
  opencode-sync divergence-resolution   Resolve data divergence
  opencode-sync help                    Show this help message
`);
    break;
  }
}

export { linkCommand, runCommand, statusCommand, divergenceResolutionCommand };
