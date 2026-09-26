/**
 * @file Message.js
 * @description Domain entity representing a rich chat message with emoji reactions
 */

import { randomUUID } from 'node:crypto';

export class Message {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.roomId
   * @param {Object} options.user - { id, name, color }
   * @param {string} options.text
   * @param {Object} [options.replyTo] - optional reference { id, user, text }
   * @param {boolean} [options.isSystem]
   */
  constructor({
    id = randomUUID(),
    roomId,
    user,
    text,
    replyTo = null,
    isSystem = false,
  }) {
    this.id = id;
    this.roomId = roomId;
    this.user = {
      id: user.id,
      name: user.name,
      color: user.color,
    };
    this.text = text.trim();
    this.replyTo = replyTo;
    this.isSystem = isSystem;
    this.timestamp = Date.now();
    // Map of emoji -> Set of userIds
    this.reactions = new Map();
  }

  /**
   * Toggle emoji reaction for a given user
   * @param {string} emoji
   * @param {string} userId
   * @returns {boolean} true if added, false if removed
   */
  toggleReaction(emoji, userId) {
    if (!this.reactions.has(emoji)) {
      this.reactions.set(emoji, new Set());
    }

    const userSet = this.reactions.get(emoji);
    let added = false;
    if (userSet.has(userId)) {
      userSet.delete(userId);
      if (userSet.size === 0) {
        this.reactions.delete(emoji);
      }
    } else {
      userSet.add(userId);
      added = true;
    }
    return added;
  }

  toJSON() {
    // Format reactions as object: { "👍": ["userId1", "userId2"] }
    const reactionsObj = {};
    for (const [emoji, userSet] of this.reactions.entries()) {
      reactionsObj[emoji] = Array.from(userSet);
    }

    return {
      id: this.id,
      roomId: this.roomId,
      user: this.user,
      text: this.text,
      replyTo: this.replyTo,
      isSystem: this.isSystem,
      timestamp: this.timestamp,
      reactions: reactionsObj,
    };
  }
}
