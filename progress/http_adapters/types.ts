// CSEAdapter — the uniform transport contract every adapter implements.
// One send, one subscription callback, connect/disconnect lifecycle.
export interface CSEAdapter {
    send(msg: CSEMessage): void
    onMessage(handler: (msg: CSEMessage) => void): () => void
    onConnect(handler: () => void): void
    onDisconnect(handler: () => void): void
}

// CSEMessage — the wire envelope. `kind` discriminates traffic class;
// `from` routes replies; p is whatever your bus ships.
export interface CSEMessage {
    kind: string
    from: string
    to?: string
    rt?: string
    p?: unknown
    [key: string]: unknown
}
