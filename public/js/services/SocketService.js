/**
 * @file SocketService.js
 * @description Real-time WebSocket connection manager using Socket.IO client
 */

import { EventEmitter } from '../core/EventEmitter.js';
import { SOCKET_EVENTS } from '../config/constants.js';

export class SocketService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Initializes Socket.IO connection
   */
  connect() {
    if (this.socket) return;

    // Use global io injected by /socket.io/socket.io.js
    this.socket = window.io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this._setupListeners();
  }

  /**
   * @private
   */
  _setupListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[SocketService] Connected. Socket ID:', this.socket.id);
      this.emit('connection_status', { connected: true, socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[SocketService] Disconnected:', reason);
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketService] Connection error:', error.message);
      this.emit('connection_error', error);
    });

    // Wire all system events to internal event emitter
    Object.values(SOCKET_EVENTS).forEach((eventName) => {
      this.socket.on(eventName, (data) => {
        this.emit(eventName, data);
      });
    });
  }

  /**
   * Emit an event and wait for callback resolution (Promise-based)
   * @param {string} event
   * @param {Object} [data]
   * @returns {Promise<any>}
   */
  emitAsync(event, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Socket is not connected'));
      }

      this.socket.emit(event, data, (response) => {
        if (response && response.success === false) {
          return reject(new Error(response.error || 'Operation failed'));
        }
        resolve(response);
      });
    });
  }

  /**
   * Fire-and-forget socket emit
   * @param {string} event
   * @param {Object} [data]
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
    super.emit(event, data);
  }

  /**
   * Get current socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}
