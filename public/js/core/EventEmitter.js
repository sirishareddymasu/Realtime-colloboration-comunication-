/**
 * @file EventEmitter.js
 * @description Decoupled Pub/Sub event bus implementation ensuring low coupling across modules
 */

export class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event
   * @param {Function} handler
   * @returns {() => void} unsubscribe function
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    if (!this._listeners.has(event)) return;
    this._listeners.get(event).delete(handler);
    if (this._listeners.get(event).size === 0) {
      this._listeners.delete(event);
    }
  }

  /**
   * Dispatch an event to all subscribers
   * @param {string} event
   * @param {*} [data]
   */
  emit(event, data) {
    if (!this._listeners.has(event)) return;
    for (const handler of this._listeners.get(event)) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventEmitter] Error in listener for event "${event}":`, err);
      }
    }
  }

  /**
   * Subscribe to an event once
   * @param {string} event
   * @param {Function} handler
   */
  once(event, handler) {
    const unsub = this.on(event, (data) => {
      unsub();
      handler(data);
    });
  }
}
