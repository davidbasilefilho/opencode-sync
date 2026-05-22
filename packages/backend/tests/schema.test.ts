import { describe, it, expect } from "vitest";

import schema from "../convex/schema.js";

function getTableNames(): Array<string> {
  const raw = schema as unknown as Record<string, unknown>;
  const tables = raw.tables as Record<string, unknown>;
  return Object.keys(tables);
}

describe("Schema definition", () => {
  it("defines a threads table", () => {
    const tableNames = getTableNames();
    expect(tableNames).toContain("threads");
  });

  it("defines a messages table", () => {
    const tableNames = getTableNames();
    expect(tableNames).toContain("messages");
  });

  it("defines an attachments table", () => {
    const tableNames = getTableNames();
    expect(tableNames).toContain("attachments");
  });

  it("has exactly three tables", () => {
    const tableNames = getTableNames();
    expect(tableNames).toHaveLength(3);
  });
});
