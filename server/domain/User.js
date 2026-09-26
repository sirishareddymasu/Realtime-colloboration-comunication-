/**
 * @file User.js
 * @description Domain entity representing a collaborative user in the workspace
 */

import { randomUUID } from 'node:crypto';

/**
 * Curated high-contrast aesthetic colors for avatars and real-time cursors
 */
export const USER_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#a855f7', // Purple
];

export const USER_STATUSES = {
  ACTIVE: 'active',
  BUSY: 'busy',
  MEETING: 'in-meeting',
  AWAY: 'away',
};

export class User {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.socketId
   * @param {string} options.name
   * @param {string} [options.color]
   * @param {string} [options.status]
   * @param {string} [options.currentFocus]
   */
  constructor({
    id = randomUUID(),
    socketId,
    name = 'Anonymous',
    color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
    status = USER_STATUSES.ACTIVE,
    currentFocus = 'Workspace Home',
  }) {
    this.id = id;
    this.socketId = socketId;
    this.name = name.trim().slice(0, 32);
    this.color = color;
    this.status = Object.values(USER_STATUSES).includes(status) ? status : USER_STATUSES.ACTIVE;
    this.currentFocus = currentFocus;
    this.joinedAt = Date.now();
    this.lastSeen = Date.now();
  }

  /**
   * Updates user availability status
   * @param {string} newStatus
   */
  setStatus(newStatus) {
    if (Object.values(USER_STATUSES).includes(newStatus)) {
      this.status = newStatus;
      this.touch();
    }
  }

  /**
   * Updates what document or channel user is currently viewing/editing
   * @param {string} focusText
   */
  setFocus(focusText) {
    this.currentFocus = focusText.slice(0, 64);
    this.touch();
  }

  /**
   * Updates last active timestamp
   */
  touch() {
    this.lastSeen = Date.now();
  }

  /**
   * Serializes User to public JSON (omitting sensitive or internal fields)
   */
  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      color: this.color,
      status: this.status,
      currentFocus: this.currentFocus,
      joinedAt: this.joinedAt,
      lastSeen: this.lastSeen,
    };
  }
}
