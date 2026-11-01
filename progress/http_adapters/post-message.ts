import { CSEAdapter, CSEMessage } from "../types";


export function postMessageAdapter(target: Window, targetOrigin: string): CSEAdapter {
    const messageHandlers = new Set<(msg: CSEMessage) => void>();
    const connectHandlers = new Set<() => void>();
    const disconnectHandlers = new Set<() => void>();

    const listener = (event: MessageEvent) => {
        if (event.origin !== targetOrigin) return;
        const msg = event.data as CSEMessage;
        if (!msg || typeof msg !== "object" || !("rt" in msg)) return;
        messageHandlers.forEach(h => h(msg));
    };

    window.addEventListener("message", listener);

    return {
        send: (msg: CSEMessage) => target.postMessage(msg, targetOrigin),
        onMessage: (handler: any) => {
            messageHandlers.add(handler);
            return () => messageHandlers.delete(handler);
        },
        onConnect: (handler: any) => {
            connectHandlers.add(handler);
            handler();
            return () => connectHandlers.delete(handler);
        },
        onDisconnect: (handler: any) => {
            disconnectHandlers.add(handler);
            return () => disconnectHandlers.delete(handler);
        },
    };
}

export function postMessageAdapterVSCode(): CSEAdapter {
  const vscodeApi = (window as any).acquireVsCodeApi();

  const messageHandlers = new Set<(msg: any) => void>();
  const connectHandlers = new Set<() => void>();
  const disconnectHandlers = new Set<() => void>();

  const listener = (e: MessageEvent) => {
    messageHandlers.forEach(h => h(e.data));
  };
  window.addEventListener('message', listener);

  return {
    send: (msg: any) => vscodeApi.postMessage(msg),

    onMessage: (handler: (msg: any) => void) => {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    },

    onConnect: (handler: () => void) => {
      connectHandlers.add(handler);
      handler(); // webview is "connected" the moment the API is acquired — no separate handshake exists
      return () => connectHandlers.delete(handler);
    },

    onDisconnect: (handler: () => void) => {
      disconnectHandlers.add(handler);
      // fires when the webview itself is torn down (panel closed / VSCode reloads the webview)
      window.addEventListener('unload', handler);
      return () => {
        disconnectHandlers.delete(handler);
        window.removeEventListener('unload', handler);
      };
    },
  };
}
