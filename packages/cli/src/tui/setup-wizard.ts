import { createCliRenderer, Box, Text } from "@opentui/core";
import { Input } from "@opentui/core";
import type { SyncConfig } from "opencodedb-types";
import { SyncConfigSchema } from "opencodedb-types";

interface WizardResult {
  convexUrl: string;
  apiKey: string;
  storageRoot: string;
}

export async function runSetupWizard(): Promise<WizardResult | null> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    screenMode: "main-screen",
  });

  let convexUrl = "";
  let apiKey = "";
  let storageRoot = "";
  let step: "url" | "apikey" | "confirm" = "url";
  let result: WizardResult | null = null;

  const urlInput = Input({
    id: "url-input",
    placeholder: "https://my-project.convex.cloud",
    width: 60,
    backgroundColor: "#222",
    focusedBackgroundColor: "#333",
    textColor: "#FFF",
    cursorColor: "#0F0",
  });

  const apiKeyInput = Input({
    id: "apikey-input",
    placeholder: "sk-...",
    width: 60,
    backgroundColor: "#222",
    focusedBackgroundColor: "#333",
    textColor: "#FFF",
    cursorColor: "#0F0",
  });

  let currentStepId: string | null = null;
  let currentStepComponent: unknown = null;

  function renderStep(): void {
    if (currentStepId !== null) {
      renderer.root.remove(currentStepId);
    }

    if (step === "url") {
      currentStepId = "step-url";
      currentStepComponent = Box(
        {
          id: "step-url",
          width: 70,
          borderStyle: "rounded",
          borderColor: "#666",
          padding: 1,
          flexDirection: "column",
          gap: 1,
        },
        Text({ content: "OpenCode Sync - Setup Wizard", fg: "#FFFF00", attributes: 1 }),
        Text({ content: "Step 1/2: Enter your Convex deployment URL", fg: "#AAA" }),
        urlInput,
      );
      urlInput.focus();
    } else if (step === "apikey") {
      currentStepId = "step-apikey";
      currentStepComponent = Box(
        {
          id: "step-apikey",
          width: 70,
          borderStyle: "rounded",
          borderColor: "#666",
          padding: 1,
          flexDirection: "column",
          gap: 1,
        },
        Text({ content: "OpenCode Sync - Setup Wizard", fg: "#FFFF00", attributes: 1 }),
        Text({ content: "Step 2/2: Enter your API key", fg: "#AAA" }),
        apiKeyInput,
      );
      apiKeyInput.focus();
    } else if (step === "confirm") {
      const config: SyncConfig = {
        convexUrl,
        apiKey,
        machineId: "wizard-setup",
        storageRoot,
      };
      const validation = SyncConfigSchema.safeParse(config);

      currentStepId = "step-confirm";
      currentStepComponent = Box(
        {
          id: "step-confirm",
          width: 70,
          borderStyle: "rounded",
          borderColor: "#666",
          padding: 1,
          flexDirection: "column",
          gap: 1,
        },
        Text({ content: "Confirm Configuration", fg: "#FFFF00", attributes: 1 }),
        Text({ content: `  Convex URL:   ${convexUrl}`, fg: "#0F0" }),
        Text({ content: `  API Key:      ${apiKey.slice(0, 8)}...`, fg: "#0F0" }),
        Text({ content: `  Storage Root: ${storageRoot}`, fg: "#0F0" }),
        Text({
          content: validation.success ? "Configuration valid" : "Configuration invalid",
          fg: validation.success ? "#0F0" : "#F00",
        }),
        Text({
          content: validation.success
            ? "Press Enter to confirm, Esc to cancel"
            : "Press Esc to go back",
          fg: "#888",
        }),
      );
    }
    renderer.root.add(currentStepComponent);
  }

  urlInput.on("enter", (value: string) => {
    convexUrl = value.trim();
    step = "apikey";
    renderStep();
  });

  apiKeyInput.on("enter", (value: string) => {
    apiKey = value.trim();
    storageRoot = process.cwd();
    step = "confirm";
    renderStep();
  });

  renderer.keyInput.on("keypress", (key: { name: string }) => {
    if (key.name === "escape") {
      if (step === "confirm") {
        result = null;
        renderer.destroy();
      } else {
        step = "url";
        renderStep();
      }
    }
  });

  renderStep();

  await new Promise<void>((resolve) => {
    renderer.keyInput.on("keypress", (key: { name: string }) => {
      if (step === "confirm" && key.name === "return") {
        const config: SyncConfig = {
          convexUrl,
          apiKey,
          machineId: "wizard-setup",
          storageRoot,
        };
        const validation = SyncConfigSchema.safeParse(config);
        if (validation.success) {
          result = { convexUrl, apiKey, storageRoot };
        }
        renderer.destroy();
      }
    });

    renderer.on("destroy", () => {
      resolve();
    });
  });

  return result;
}
