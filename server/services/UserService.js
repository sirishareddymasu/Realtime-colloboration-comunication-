/**
 * @file UserService.js
 * @description Service managing active user presence, profiles, and activity tracking
 */

import { User } from '../domain/User.js';

export class UserService {
  constructor() {
    /** @type {Map<string, User>} Map of socketId -> User */
    this.usersBySocket = new Map();
  }

  /**
   * Register or reconnect a user with their socket session
   * @param {Object} userData
   * @param {string} socketId
   * @returns {User}
   */
  registerUser(userData, socketId) {
    const user = new User({
      id: userData.id,
      socketId,
      name: userData.name || `Dev-${socketId.slice(0, 4)}`,
      color: userData.color,
      status: userData.status,
      currentFocus: userData.currentFocus || 'Live Workspace',
    });

    this.usersBySocket.set(socketId, user);
    return user;
  }

  /**
   * Get user by socket ID
   * @param {string} socketId
   * @returns {User|undefined}
   */
  getUser(socketId) {
    return this.usersBySocket.get(socketId);
  }

  /**
   * Remove user on socket disconnect
   * @param {string} socketId
   * @returns {User|null} the removed user
   */
  removeUser(socketId) {
    const user = this.usersBySocket.get(socketId);
    if (user) {
      this.usersBySocket.delete(socketId);
      return user;
    }
    return null;
  }

  /**
   * Update status of user
   * @param {string} socketId
   * @param {string} status
   * @returns {User|null}
   */
  updateStatus(socketId, status) {
    const user = this.usersBySocket.get(socketId);
    if (user) {
      user.setStatus(status);
      return user;
    }
    return null;
  }

  /**
   * Update what the user is currently working on
   * @param {string} socketId
   * @param {string} focusText
   * @returns {User|null}
   */
  updateFocus(socketId, focusText) {
    const user = this.usersBySocket.get(socketId);
    if (user) {
      user.setFocus(focusText);
      return user;
    }
    return null;
  }

  /**
   * Returns list of all active users
   * @returns {Array<Object>}
   */
  getAllUsers() {
    return Array.from(this.usersBySocket.values()).map((user) => user.toJSON());
  }

  /**
   * Get total count of currently connected users
   * @returns {number}
   */
  getConnectedCount() {
    return this.usersBySocket.size;
  }
}
