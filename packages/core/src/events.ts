/**
 * A tiny, dependency-free typed event emitter.
 *
 * We deliberately avoid pulling in Node's `events` module so that the SDK
 * stays isomorphic (browser + Node) with zero polyfills.
 *
 * Internally listeners are stored untyped (a `Map` of `Set`s) to sidestep the
 * generic-variance limitations of indexing a mapped type; the public `on` /
 * `emit` signatures remain fully type-safe.
 */

import type {
  FiberEventListener,
  FiberEventMap,
  FiberEventName,
} from "./types.js";

type AnyListener = (payload: unknown) => void;

export class FiberEventEmitter {
  private readonly listeners = new Map<FiberEventName, Set<AnyListener>>();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on<EventName extends FiberEventName>(
    event: EventName,
    listener: FiberEventListener<EventName>,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as AnyListener);
    return () => this.off(event, listener);
  }

  once<EventName extends FiberEventName>(
    event: EventName,
    listener: FiberEventListener<EventName>,
  ): () => void {
    const off = this.on(event, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  off<EventName extends FiberEventName>(
    event: EventName,
    listener: FiberEventListener<EventName>,
  ): void {
    this.listeners.get(event)?.delete(listener as AnyListener);
  }

  emit<EventName extends FiberEventName>(
    event: EventName,
    payload: FiberEventMap[EventName],
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copy to a snapshot so listeners can safely unsubscribe during dispatch.
    for (const listener of [...set]) {
      try {
        listener(payload);
      } catch {
        // A misbehaving listener must not break the emit loop.
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
