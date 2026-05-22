// Type stubs for Convex generated API module.
// Replaced at runtime by `npx convex dev`.

export declare const api: {
  persistentTextStreaming: {
    stream: {
      createStream: unknown;
      getStreamBody: unknown;
      stream: unknown;
      deleteStream: unknown;
    };
  };
};

export declare const internal: {
  threads: {
    createThread: unknown;
    updateThread: unknown;
    deleteThread: unknown;
    listThreads: unknown;
    getThread: unknown;
  };
  messages: {
    createMessage: unknown;
    updateMessageStatus: unknown;
    appendText: unknown;
    setToolMetadata: unknown;
    setToolResult: unknown;
    listMessages: unknown;
  };
  attachments: {
    createAttachment: unknown;
    deleteAttachment: unknown;
    listAttachments: unknown;
  };
  cron: {
    deadlockDetection: unknown;
  };
  streaming: {
    createStream: unknown;
    streamChat: unknown;
    health: unknown;
  };
  sync: {
    pushUpdates: unknown;
    pullUpdates: unknown;
  };
};
