/**
 * @file Room.js
 * @description Domain entity representing a collaborative chat channel or topic room
 */

export class Room {
  /**
   * @param {Object} options
   * @param {string} options.id - e.g. 'general', 'engineering'
   * @param {string} options.name - Display name e.g. '#general'
   * @param {string} [options.topic] - Description or goal of this channel
   * @param {boolean} [options.isDefault]
   */
  constructor({ id, name, topic = '', isDefault = false }) {
    this.id = id;
    this.name = name.startsWith('#') ? name : `#${name}`;
    this.topic = topic;
    this.isDefault = isDefault;
    this.createdAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      topic: this.topic,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
    };
  }
}
