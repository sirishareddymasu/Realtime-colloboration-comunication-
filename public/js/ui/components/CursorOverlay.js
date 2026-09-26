/**
 * @file CursorOverlay.js
 * @description Workspace pointer radar rendering live collaborator mouse positions with custom colored arrows
 */

export class CursorOverlay {
  /**
   * @param {Object} options
   * @param {import('../../core/Store.js').Store} options.store
   * @param {import('../../core/EventEmitter.js').EventEmitter} options.events
   */
  constructor({ store, events }) {
    this.store = store;
    this.events = events;
    this.container = document.getElementById('cursor-radar-container');
    this.pointers = new Map(); // socketId -> DOMElement
    this.lastSentTime = 0;

    this._attachListeners();
  }

  _attachListeners() {
    // Listen to local mouse movements
    window.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - this.lastSentTime > 40) { // Throttle to 25fps for silky responsiveness
        this.lastSentTime = now;
        this.events.emit('local_pointer_move', {
          x: e.clientX,
          y: e.clientY,
        });
      }
    });

    // Remote pointers sync
    this.events.on('remote_pointer_sync', (data) => {
      if (data.remove) {
        this.removePointer(data.socketId);
      } else {
        this.updateRemotePointer(data);
      }
    });
  }

  /**
   * Update or create a remote pointer element
   * @param {Object} data - { socketId, user, x, y }
   */
  updateRemotePointer(data) {
    if (!this.container) return;

    let el = this.pointers.get(data.socketId);
    if (!el) {
      el = document.createElement('div');
      el.className = 'remote-pointer';

      // SVG mouse pointer arrow
      el.innerHTML = `
        <svg class="remote-pointer-arrow" viewBox="0 0 24 24" fill="${data.user.color || '#6366f1'}" stroke="#ffffff" stroke-width="1.5">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </svg>
        <div class="remote-pointer-label" style="background-color: ${data.user.color || '#6366f1'}">
          ${data.user.name || 'Collaborator'}
        </div>
      `;

      this.container.appendChild(el);
      this.pointers.set(data.socketId, el);
    }

    el.style.transform = `translate3d(${data.x}px, ${data.y}px, 0)`;
  }

  /**
   * Remove pointer element
   * @param {string} socketId
   */
  removePointer(socketId) {
    const el = this.pointers.get(socketId);
    if (el) {
      el.remove();
      this.pointers.delete(socketId);
    }
  }
}
