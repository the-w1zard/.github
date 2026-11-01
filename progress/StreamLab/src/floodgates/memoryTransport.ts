import type { TransportDescriptor, TransportHandle, TransportProvider } from "./types.ts";

/**
 * MemoryTransport — a provider bound to in-memory queues, so the flood
 * routing logic (threshold crossing, gate opening, fallback, least-loaded
 * spreading) is fully verifiable in this VM without WebTransport/WebRTC.
 *
 * Swap this for the real provider on your bus — the engine is identical.
 */
export class MemoryTransportProvider implements TransportProvider {
  /** Simulated wire latency for each descriptor, default 5ms. */
  latency = 5;
  /** Simulated failures: probe returns false for these names. */
  unavailable = new Set<string>();

  // Descriptor → queue of received frames.
  readonly inboxes = new Map<string, Uint8Array[]>();

  async probe(descriptor: TransportDescriptor): Promise<boolean> {
    return !this.unavailable.has(descriptor.name);
  }

  async connect(descriptor: TransportDescriptor): Promise<TransportHandle> {
    const inbox: Uint8Array[] = [];
    this.inboxes.set(descriptor.name, inbox);
    let closed = false;
    let onOpen: (() => void) | undefined;
    let onClose: (() => void) | undefined;
    const handle: TransportHandle = {
      name: descriptor.name,
      category: descriptor.category,
      send: async (frame) => {
        if (closed) return;
        if (this.latency > 0) await new Promise((r) => setTimeout(r, this.latency));
        inbox.push(frame);
      },
      close: () => { if (closed) return; closed = true; onClose?.(); },
      onOpen: (cb) => { onOpen = cb; queueMicrotask(cb); },
      onClose: (cb) => { onClose = cb; },
    };
    return handle;
  }
}
