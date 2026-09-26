/**
 * @file presenceHandler.js
 * @description Socket event handler managing user presence, cursor radar, and status changes
 */

import { SOCKET_EVENTS } from '../socketEvents.js';

/**
 * Register presence socket events
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../../services/UserService.js').UserService} userService
 * @param {import('../../services/DocumentService.js').DocumentService} documentService
 */
export function registerPresenceHandler(io, socket, userService, documentService) {
  // User joins workspace with profile info
  socket.on(SOCKET_EVENTS.USER_JOIN, (userData, callback) => {
    try {
      const user = userService.registerUser(userData || {}, socket.id);

      // Acknowledge back to the joining user
      if (typeof callback === 'function') {
        callback({ success: true, user: user.toJSON() });
      }

      // Broadcast updated user roster to all clients
      io.emit(SOCKET_EVENTS.USERS_SYNC, userService.getAllUsers());

      // Broadcast system arrival notification
      socket.broadcast.emit(SOCKET_EVENTS.SYSTEM_NOTIFICATION, {
        type: 'info',
        message: `${user.name} joined the workspace`,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[PresenceHandler] Error on USER_JOIN:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // User updates their status (Active, Away, Busy, In-Meeting)
  socket.on(SOCKET_EVENTS.USER_UPDATE_STATUS, ({ status }) => {
    const user = userService.updateStatus(socket.id, status);
    if (user) {
      io.emit(SOCKET_EVENTS.USERS_SYNC, userService.getAllUsers());
    }
  });

  // User updates their current focus (e.g. Document or Channel)
  socket.on(SOCKET_EVENTS.USER_UPDATE_FOCUS, ({ focusText }) => {
    const user = userService.updateFocus(socket.id, focusText);
    if (user) {
      io.emit(SOCKET_EVENTS.USERS_SYNC, userService.getAllUsers());
    }
  });

  // User moves their mouse pointer across the collaborative workspace screen (Pointer Radar)
  socket.on(SOCKET_EVENTS.USER_POINTER_MOVE, (pointerData) => {
    const user = userService.getUser(socket.id);
    if (!user) return;

    // Broadcast pointer position to everyone else
    socket.broadcast.emit(SOCKET_EVENTS.USER_POINTER_SYNC, {
      socketId: socket.id,
      user: {
        id: user.id,
        name: user.name,
        color: user.color,
      },
      x: pointerData.x,
      y: pointerData.y,
      timestamp: Date.now(),
    });
  });

  // Handle disconnect
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const user = userService.removeUser(socket.id);
    documentService.removeCursorFromAll(socket.id);

    if (user) {
      io.emit(SOCKET_EVENTS.USERS_SYNC, userService.getAllUsers());
      socket.broadcast.emit(SOCKET_EVENTS.USER_POINTER_SYNC, {
        socketId: socket.id,
        remove: true,
      });

      socket.broadcast.emit(SOCKET_EVENTS.SYSTEM_NOTIFICATION, {
        type: 'neutral',
        message: `${user.name} left the workspace`,
        timestamp: Date.now(),
      });
    }
  });
}
