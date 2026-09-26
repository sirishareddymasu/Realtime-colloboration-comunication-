/**
 * @file Store.js
 * @description Centralized reactive state store managing application data flow
 */

import { EventEmitter } from './EventEmitter.js';

export class Store extends EventEmitter {
  /**
   * @param {Object} initialState
   */
  constructor(initialState = {}) {
    super();
    this._state = {
      currentUser: null,
      users: [],
      documents: [],
      currentDoc: null,
      rooms: [],
      currentRoomId: 'general',
      messages: [],
      typingUsers: [],
      soundEnabled: true,
      editorViewMode: 'split', // 'edit' | 'split' | 'preview'
      syncStatus: 'synced', // 'synced' | 'syncing' | 'offline'
      remotePointers: new Map(),
      ...initialState,
    };
  }

  /**
   * Get immutable snapshot of current state
   * @returns {Object}
   */
  getState() {
    return this._state;
  }

  /**
   * Update state and notify subscribers
   * @param {Object} partialState
   * @param {string} [actionTag]
   */
  setState(partialState, actionTag = 'STATE_CHANGED') {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...partialState };
    this.emit('change', { state: this._state, prevState, actionTag });
    this.emit(actionTag, this._state);
  }

  /**
   * Subscribe to state modifications
   * @param {Function} listener
   * @returns {() => void}
   */
  subscribe(listener) {
    return this.on('change', listener);
  }
}
