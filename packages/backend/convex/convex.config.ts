import convexApiKeys from "@00akshatsinha00/convex-api-keys/convex.config";
import actionCache from "@convex-dev/action-cache/convex.config";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";
import llmCache from "@mzedstudio/llm-cache/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(persistentTextStreaming);
app.use(llmCache);
app.use(actionCache);
app.use(convexApiKeys);
export default app;
