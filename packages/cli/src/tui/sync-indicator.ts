import { Text } from "@opentui/core";

const FRAMES = [
  "\u280B",
  "\u2819",
  "\u2839",
  "\u2838",
  "\u283C",
  "\u2834",
  "\u2826",
  "\u2827",
  "\u280F",
  "\u280F",
];

export interface SyncIndicator {
  stop(): void;
}

export function createSyncIndicator(renderer: {
  root: { add: (c: unknown) => void; remove: () => void };
  requestLive: () => void;
  dropLive: () => void;
}): SyncIndicator {
  let frameIndex = 0;
  let running = true;

  const textComponent = Text({
    id: "sync-indicator",
    content: `${FRAMES[0]} Syncing...`,
    fg: "#00FFFF",
    attributes: 1,
  });

  renderer.root.add(textComponent);
  renderer.requestLive();

  const interval = setInterval(() => {
    if (!running) return;
    frameIndex = (frameIndex + 1) % FRAMES.length;
    renderer.root.remove();
    const updated = Text({
      id: "sync-indicator",
      content: `${FRAMES[frameIndex]} Syncing...`,
      fg: "#00FFFF",
      attributes: 1,
    });
    renderer.root.add(updated);
  }, 100);

  return {
    stop(): void {
      running = false;
      clearInterval(interval);
      renderer.root.remove();
      renderer.dropLive();
    },
  };
}
