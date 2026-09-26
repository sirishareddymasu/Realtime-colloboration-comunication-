/**
 * @file chatHandler.js
 * @description Socket event handler managing channel communications, messages, and emoji reactions
 */

import { SOCKET_EVENTS } from '../socketEvents.js';

/**
 * Register chat socket events
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../../services/ChatService.js').ChatService} chatService
 * @param {import('../../services/RoomService.js').RoomService} roomService
 * @param {import('../../services/UserService.js').UserService} userService
 */
export function registerChatHandler(io, socket, chatService, roomService, userService) {
  // Join a chat room
  socket.on(SOCKET_EVENTS.CHAT_JOIN_ROOM, ({ roomId }, callback) => {
    const room = roomService.getRoom(roomId);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
      return;
    }

    const roomSocketGroup = `room:${roomId}`;
    socket.join(roomSocketGroup);

    // Fetch room history
    const history = chatService.getRoomMessages(roomId, 100);

    if (typeof callback === 'function') {
      callback({
        success: true,
        room: room.toJSON(),
        messages: history,
      });
    }
  });

  // Leave a chat room
  socket.on(SOCKET_EVENTS.CHAT_LEAVE_ROOM, ({ roomId }) => {
    socket.leave(`room:${roomId}`);
  });

  // Send a message to a room
  socket.on(SOCKET_EVENTS.CHAT_SEND_MESSAGE, ({ roomId, text, replyTo }, callback) => {
    const user = userService.getUser(socket.id);
    if (!user) {
      if (typeof callback === 'function') callback({ success: false, error: 'User not registered' });
      return;
    }

    if (!text || text.trim().length === 0) {
      if (typeof callback === 'function') callback({ success: false, error: 'Message cannot be empty' });
      return;
    }

    const message = chatService.addMessage(roomId, user, text, replyTo);

    // Broadcast to everyone in the room
    io.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_RECEIVE_MESSAGE, message.toJSON());

    // Reset typing indicator for this user
    chatService.setTyping(roomId, user, false);
    io.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING_INDICATOR, {
      roomId,
      typingUsers: [],
    });

    if (typeof callback === 'function') {
      callback({ success: true, message: message.toJSON() });
    }
  });

  // Typing status indicator
  socket.on(SOCKET_EVENTS.CHAT_TYPING_INDICATOR, ({ roomId, isTyping }) => {
    const user = userService.getUser(socket.id);
    if (!user) return;

    const typingUsers = chatService.setTyping(roomId, user, isTyping);

    // Broadcast to others in the room
    socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING_INDICATOR, {
      roomId,
      typingUsers,
    });
  });

  // Toggle emoji reaction
  socket.on(SOCKET_EVENTS.CHAT_REACTION_TOGGLE, ({ roomId, messageId, emoji }, callback) => {
    const user = userService.getUser(socket.id);
    if (!user) return;

    const message = chatService.toggleReaction(roomId, messageId, emoji, user.id);
    if (message) {
      io.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_REACTION_UPDATE, {
        roomId,
        messageId,
        reactions: message.toJSON().reactions,
      });

      if (typeof callback === 'function') {
        callback({ success: true, reactions: message.toJSON().reactions });
      }
    }
  });

  // Create new channel
  socket.on(SOCKET_EVENTS.CHAT_ROOM_CREATE, ({ name, topic }, callback) => {
    try {
      const room = roomService.createRoom(name, topic);
      io.emit(SOCKET_EVENTS.CHAT_ROOMS_SYNC, roomService.getAllRooms());

      if (typeof callback === 'function') {
        callback({ success: true, room: room.toJSON() });
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });
}
