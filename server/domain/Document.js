/**
 * @file Document.js
 * @description Domain entity representing a live collaborative document with version checkpoints and cursor tracking
 */

import { randomUUID } from 'node:crypto';
import { APP_CONFIG } from '../config/appConfig.js';

export class Document {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.title
   * @param {string} [options.content]
   * @param {string} [options.language] - 'markdown', 'javascript', 'html', 'json'
   * @param {Object} [options.createdBy]
   */
  constructor({
    id = randomUUID(),
    title,
    content = '',
    language = 'markdown',
    createdBy = { name: 'System' },
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.language = language;
    this.version = 1;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.lastModifiedBy = createdBy;
    /** @type {Array<{id: string, version: number, title: string, content: string, timestamp: number, author: Object}>} */
    this.checkpoints = [
      {
        id: randomUUID(),
        version: 1,
        title: 'Initial Document Creation',
        content: content,
        timestamp: Date.now(),
        author: createdBy,
      },
    ];
    /** @type {Map<string, {user: Object, line: number, ch: number, selection: Object, lastUpdate: number}>} */
    this.activeCursors = new Map();
  }

  /**
   * Applies a collaborative document update
   * @param {string} newContent
   * @param {Object} author
   * @returns {{version: number, updatedAt: number}}
   */
  applyUpdate(newContent, author) {
    this.content = newContent;
    this.version += 1;
    this.updatedAt = Date.now();
    this.lastModifiedBy = author;
    return {
      version: this.version,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates a manual or automated checkpoint/snapshot in document history
   * @param {string} title
   * @param {Object} author
   * @returns {Object} the newly created checkpoint
   */
  createCheckpoint(title, author) {
    const checkpoint = {
      id: randomUUID(),
      version: this.version,
      title: title || `Checkpoint v${this.version}`,
      content: this.content,
      timestamp: Date.now(),
      author: author || { name: 'System' },
    };

    this.checkpoints.unshift(checkpoint);

    // Keep checkpoint list within max size limit
    if (this.checkpoints.length > APP_CONFIG.DOCUMENTS.MAX_SNAPSHOT_HISTORY) {
      this.checkpoints.pop();
    }

    return checkpoint;
  }

  /**
   * Reverts document content to a specified checkpoint
   * @param {string} checkpointId
   * @param {Object} author
   * @returns {Object|null} restored checkpoint or null if not found
   */
  revertToCheckpoint(checkpointId, author) {
    const checkpoint = this.checkpoints.find((cp) => cp.id === checkpointId);
    if (!checkpoint) {
      return null;
    }

    this.content = checkpoint.content;
    this.version += 1;
    this.updatedAt = Date.now();
    this.lastModifiedBy = author;

    // Record the revert action as a new checkpoint
    this.createCheckpoint(`Reverted to: ${checkpoint.title}`, author);

    return checkpoint;
  }

  /**
   * Updates or registers an active remote cursor
   * @param {string} socketId
   * @param {Object} user
   * @param {number} line
   * @param {number} ch
   * @param {Object} [selection]
   */
  updateCursor(socketId, user, line, ch, selection = null) {
    this.activeCursors.set(socketId, {
      user: {
        id: user.id,
        name: user.name,
        color: user.color,
      },
      line,
      ch,
      selection,
      lastUpdate: Date.now(),
    });
  }

  /**
   * Removes a remote cursor when a user changes doc or disconnects
   * @param {string} socketId
   */
  removeCursor(socketId) {
    this.activeCursors.delete(socketId);
  }

  /**
   * Serializes Document for client transmission
   * @param {boolean} [includeContent=true]
   */
  toJSON(includeContent = true) {
    const cursorsList = [];
    for (const [socketId, cursorData] of this.activeCursors.entries()) {
      cursorsList.push({
        socketId,
        ...cursorData,
      });
    }

    const data = {
      id: this.id,
      title: this.title,
      language: this.language,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastModifiedBy: this.lastModifiedBy,
      checkpointsCount: this.checkpoints.length,
      cursors: cursorsList,
    };

    if (includeContent) {
      data.content = this.content;
      data.checkpoints = this.checkpoints;
    }

    return data;
  }
}
