/**
 * @file ChatService.js
 * @description Service managing chat messages, history buffers, and emoji reactions
 */

import { Message } from '../domain/Message.js';
import { APP_CONFIG } from '../config/appConfig.js';

export class ChatService {
  constructor() {
    /** @type {Map<string, Array<Message>>} Map of roomId -> Message[] */
    this.messagesByRoom = new Map();
    /** @type {Map<string, Map<string, number>>} Map of roomId -> (userId -> lastTypingTimestamp) */
    this.typingByRoom = new Map();

    this._seedInitialMessages();
  }

  /**
   * Pre-seeds welcoming introductory messages for immediate collaboration demo
   * @private
   */
  _seedInitialMessages() {
    const systemBot = {
      id: 'bot-nexus',
      name: 'Nexus Bot 🤖',
      color: '#6366f1',
    };

    const initialSeed = [
      {
        roomId: 'general',
        user: systemBot,
        text: '👋 Welcome to **NexusCollab**! Real-time collaborative workspace with live document editing, presence, and chat.',
      },
      {
        roomId: 'general',
        user: { id: 'user-elena', name: 'Elena Rostova', color: '#10b981' },
        text: 'Hey team! Glad to have our real-time collaboration hub live. Try switching documents in the top toolbar!',
      },
      {
        roomId: 'engineering',
        user: { id: 'user-marcus', name: 'Marcus Chen', color: '#ec4899' },
        text: 'The WebSocket synchronization latency is sub-15ms! Also testing inline code blocks: `const sync = new RealtimeEngine();` 🚀',
      },
      {
        roomId: 'design-sync',
        user: { id: 'user-sophia', name: 'Sophia Miller', color: '#8b5cf6' },
        text: 'The glassmorphic dark theme and live remote cursor badges look fantastic! Try opening another tab to test cursor tracking.',
      },
    ];

    for (const item of initialSeed) {
      this.addMessage(item.roomId, item.user, item.text);
    }
  }

  /**
   * Adds a new message to a room
   * @param {string} roomId
   * @param {Object} user
   * @param {string} text
   * @param {Object} [replyTo]
   * @returns {Message}
   */
  addMessage(roomId, user, text, replyTo = null) {
    if (!this.messagesByRoom.has(roomId)) {
      this.messagesByRoom.set(roomId, []);
    }

    const roomBuffer = this.messagesByRoom.get(roomId);
    const message = new Message({
      roomId,
      user,
      text,
      replyTo,
    });

    roomBuffer.push(message);

    // Keep within configured buffer limits
    if (roomBuffer.length > APP_CONFIG.CHAT.MAX_HISTORY_PER_ROOM) {
      roomBuffer.shift();
    }

    return message;
  }

  /**
   * Get message history for a room
   * @param {string} roomId
   * @param {number} [limit=50]
   * @returns {Array<Object>}
   */
  getRoomMessages(roomId, limit = 50) {
    const buffer = this.messagesByRoom.get(roomId) || [];
    return buffer.slice(-limit).map((msg) => msg.toJSON());
  }

  /**
   * Toggle emoji reaction on a message
   * @param {string} roomId
   * @param {string} messageId
   * @param {string} emoji
   * @param {string} userId
   * @returns {Message|null}
   */
  toggleReaction(roomId, messageId, emoji, userId) {
    const buffer = this.messagesByRoom.get(roomId);
    if (!buffer) return null;

    const message = buffer.find((m) => m.id === messageId);
    if (!message) return null;

    message.toggleReaction(emoji, userId);
    return message;
  }

  /**
   * Record typing activity
   * @param {string} roomId
   * @param {Object} user
   * @param {boolean} isTyping
   * @returns {Array<string>} list of user names currently typing
   */
  setTyping(roomId, user, isTyping) {
    if (!this.typingByRoom.has(roomId)) {
      this.typingByRoom.set(roomId, new Map());
    }

    const roomTyping = this.typingByRoom.get(roomId);
    const now = Date.now();

    if (isTyping) {
      roomTyping.set(user.name, now);
    } else {
      roomTyping.delete(user.name);
    }

    // Clean up stale typing markers
    for (const [name, timestamp] of roomTyping.entries()) {
      if (now - timestamp > APP_CONFIG.CHAT.TYPING_TIMEOUT_MS) {
        roomTyping.delete(name);
      }
    }

    return Array.from(roomTyping.keys()).filter((name) => name !== user.name);
  }
}
