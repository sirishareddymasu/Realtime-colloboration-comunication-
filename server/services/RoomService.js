/**
 * @file RoomService.js
 * @description Service managing chat rooms and discussion channels
 */

import { Room } from '../domain/Room.js';

export class RoomService {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    this._seedDefaultRooms();
  }

  /**
   * Pre-seed standard collaborative channels
   * @private
   */
  _seedDefaultRooms() {
    const defaultChannels = [
      {
        id: 'general',
        name: '#general',
        topic: 'Company & team announcements, general project discussion',
        isDefault: true,
      },
      {
        id: 'engineering',
        name: '#engineering',
        topic: 'Architecture, clean code discussions, PR reviews & socket sync',
        isDefault: true,
      },
      {
        id: 'design-sync',
        name: '#design-sync',
        topic: 'UI/UX design, tokens, micro-interactions & visual feedback',
        isDefault: true,
      },
      {
        id: 'random',
        name: '#random',
        topic: 'Watercooler chat, coffee breaks, jokes & ideas',
        isDefault: false,
      },
    ];

    for (const channel of defaultChannels) {
      this.rooms.set(channel.id, new Room(channel));
    }
  }

  /**
   * Get all registered rooms
   * @returns {Array<Object>}
   */
  getAllRooms() {
    return Array.from(this.rooms.values()).map((room) => room.toJSON());
  }

  /**
   * Get room by ID
   * @param {string} roomId
   * @returns {Room|undefined}
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Create a new chat channel
   * @param {string} name
   * @param {string} [topic]
   * @returns {Room}
   */
  createRoom(name, topic = '') {
    const cleanId = name
      .toLowerCase()
      .replace(/^#/, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    if (this.rooms.has(cleanId)) {
      return this.rooms.get(cleanId);
    }

    const newRoom = new Room({
      id: cleanId,
      name: `#${cleanId}`,
      topic,
      isDefault: false,
    });

    this.rooms.set(cleanId, newRoom);
    return newRoom;
  }
}
