import { httpAction } from "./_generated/server.js";

export const health = httpAction(async (_ctx) => {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
