/**
 * @file DocumentService.js
 * @description Service managing collaborative documents, real-time sync, version checkpoints, and cursor states
 */

import { Document } from '../domain/Document.js';

export class DocumentService {
  constructor() {
    /** @type {Map<string, Document>} */
    this.documents = new Map();
    this._seedDefaultDocuments();
  }

  /**
   * Pre-seeds high-quality collaborative starter documents
   * @private
   */
  _seedDefaultDocuments() {
    const defaultAuthor = { id: 'system', name: 'Nexus Engine', color: '#6366f1' };

    const docWelcome = new Document({
      id: 'doc-welcome',
      title: '🚀 Workspace Quickstart & Live Sync',
      language: 'markdown',
      createdBy: defaultAuthor,
      content: `# 🚀 Welcome to NexusCollab

NexusCollab is a state-of-the-art **real-time collaboration & communication workspace** designed with **Clean Architecture** principles and sub-millisecond event synchronization.

---

### ✨ Key Real-Time Capabilities

1. **Simultaneous Multi-User Editing**:
   - Multiple users can type and edit this document at the same time.
   - Character and delta updates propagate instantly across all active sessions.

2. **Live Cursor & Selection Tracking**:
   - Move your mouse or edit text to broadcast your colored cursor and position.
   - Remote collaborators can see exactly what line and character you are viewing!

3. **Checkpoints & Reversible History**:
   - Click **"Create Checkpoint"** to save named milestones.
   - Open **"Version History"** to inspect diffs and revert with 1-click.

4. **Multi-Channel Team Chat**:
   - Seamlessly switch between \`#general\`, \`#engineering\`, and \`#design-sync\`.
   - React with emojis (👍, ❤️, 🚀, 🔥) and get real-time typing indicators.

---

### 🧪 Try Multi-User Simulation:
> **Tip:** Click **"Clone Tab / New Persona"** in the top-right toolbar or open a new incognito window pointing to this address to see multi-user cursors in action!
`,
    });

    const docArch = new Document({
      id: 'doc-architecture',
      title: '📐 Clean Architecture & System Design',
      language: 'markdown',
      createdBy: defaultAuthor,
      content: `# 📐 Clean Architecture & System Design

This document outlines the architectural blueprint of NexusCollab, adhering to **Domain-Driven Design (DDD)** and **SOLID** principles.

\`\`\`
   +-----------------------------------------------------------+
   |                     Presentation Layer                    |
   |   (Glassmorphic Vanilla UI, EventBus, UI Views, Audio)   |
   +-----------------------------+-----------------------------+
                                 | WebSocket / REST
   +-----------------------------v-----------------------------+
   |                     Socket & API Layer                    |
   |    (SocketManager, ChatHandler, DocumentHandler, Routes)  |
   +-----------------------------+-----------------------------+
                                 | Orchestrates
   +-----------------------------v-----------------------------+
   |                      Service Layer                        |
   | (DocumentService, ChatService, UserService, RoomService)  |
   +-----------------------------+-----------------------------+
                                 | Encapsulates
   +-----------------------------v-----------------------------+
   |                       Domain Layer                        |
   |      (Document Entity, User Entity, Message, Room)        |
   +-----------------------------------------------------------+
\`\`\`

### 1. Single Responsibility Principle (SRP)
- **Domain Entities**: Strictly encapsulate business rules and internal state mutations (e.g. \`Document.applyUpdate()\`, \`Message.toggleReaction()\`).
- **Services**: Coordinate cross-entity workflows without bleeding into transport protocols.
- **Socket Handlers**: Handle event deserialization, validation, and dispatching only.

### 2. Open / Closed Principle (OCP)
- Event routing is decoupled via a centralized event registry (\`socketEvents.js\`), allowing new collaborative tools (e.g., whiteboards, spreadsheets) to be added without modifying existing chat or document code.

### 3. High Performance & Zero-Bloat
- Built on standard web APIs: native Web Audio API synthesizer, CSS custom properties, and optimized Socket.io broadcasts.
`,
    });

    const docAlgorithms = new Document({
      id: 'doc-code-sandbox',
      title: '⚡ Real-Time Concurrency Sandbox.js',
      language: 'javascript',
      createdBy: defaultAuthor,
      content: `/**
 * Real-Time Concurrency & Operational Synchronization Engine
 * Demonstrates clean functional transformations and debounce sync.
 */

class CollaborativeSession {
  constructor(sessionId, author) {
    this.sessionId = sessionId;
    this.author = author;
    this.vectorClock = new Map();
    this.pendingOperations = [];
  }

  /**
   * Broadcast an atomic edit delta
   */
  dispatchOperation(opType, payload) {
    const timestamp = Date.now();
    const clock = (this.vectorClock.get(this.author.id) || 0) + 1;
    this.vectorClock.set(this.author.id, clock);

    const operation = {
      id: \`op_\${clock}_\${timestamp}\`,
      type: opType,
      payload,
      clock,
      authorId: this.author.id,
      timestamp
    };

    console.log('[CollabEngine] Dispatched delta:', operation);
    return operation;
  }
}

// Instantiate demo session
const session = new CollaborativeSession('nexus-main', { id: 'usr-1', name: 'Alice' });
session.dispatchOperation('INSERT_TEXT', { position: 42, text: 'Clean Code Rocks!' });
`,
    });

    this.documents.set(docWelcome.id, docWelcome);
    this.documents.set(docArch.id, docArch);
    this.documents.set(docAlgorithms.id, docAlgorithms);
  }

  /**
   * Returns list of all available documents (metadata only)
   * @returns {Array<Object>}
   */
  getAllDocuments() {
    return Array.from(this.documents.values()).map((doc) => doc.toJSON(false));
  }

  /**
   * Retrieves document by ID (full content)
   * @param {string} docId
   * @returns {Document|undefined}
   */
  getDocument(docId) {
    return this.documents.get(docId);
  }

  /**
   * Creates a new document
   * @param {string} title
   * @param {string} [language='markdown']
   * @param {string} [initialContent='']
   * @param {Object} author
   * @returns {Document}
   */
  createDocument(title, language = 'markdown', initialContent = '', author = { name: 'User' }) {
    const cleanTitle = (title || 'Untitled Document').trim();
    const cleanId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const document = new Document({
      id: cleanId,
      title: cleanTitle,
      language,
      content: initialContent,
      createdBy: author,
    });

    this.documents.set(document.id, document);
    return document;
  }

  /**
   * Applies collaborative text update to document
   * @param {string} docId
   * @param {string} newContent
   * @param {Object} author
   * @returns {Object|null}
   */
  applyUpdate(docId, newContent, author) {
    const doc = this.documents.get(docId);
    if (!doc) return null;

    const result = doc.applyUpdate(newContent, author);
    return {
      docId: doc.id,
      version: result.version,
      updatedAt: result.updatedAt,
      author,
      content: doc.content,
    };
  }

  /**
   * Creates a named checkpoint
   * @param {string} docId
   * @param {string} title
   * @param {Object} author
   * @returns {Object|null}
   */
  createCheckpoint(docId, title, author) {
    const doc = this.documents.get(docId);
    if (!doc) return null;
    return doc.createCheckpoint(title, author);
  }

  /**
   * Reverts document to a checkpoint
   * @param {string} docId
   * @param {string} checkpointId
   * @param {Object} author
   * @returns {Object|null}
   */
  revertToCheckpoint(docId, checkpointId, author) {
    const doc = this.documents.get(docId);
    if (!doc) return null;
    const restored = doc.revertToCheckpoint(checkpointId, author);
    if (!restored) return null;

    return {
      docId: doc.id,
      document: doc.toJSON(true),
      restoredCheckpoint: restored,
    };
  }

  /**
   * Updates remote cursor position for a user in a document
   * @param {string} docId
   * @param {string} socketId
   * @param {Object} user
   * @param {number} line
   * @param {number} ch
   * @param {Object} [selection]
   * @returns {Array<Object>} list of updated cursors
   */
  updateCursor(docId, socketId, user, line, ch, selection) {
    const doc = this.documents.get(docId);
    if (!doc) return [];

    doc.updateCursor(socketId, user, line, ch, selection);
    return doc.toJSON(false).cursors;
  }

  /**
   * Remove cursor from a specific document
   * @param {string} docId
   * @param {string} socketId
   * @returns {Array<Object>}
   */
  removeCursor(docId, socketId) {
    const doc = this.documents.get(docId);
    if (!doc) return [];
    doc.removeCursor(socketId);
    return doc.toJSON(false).cursors;
  }

  /**
   * Remove cursor from all documents (e.g. On disconnect)
   * @param {string} socketId
   */
  removeCursorFromAll(socketId) {
    for (const doc of this.documents.values()) {
      doc.removeCursor(socketId);
    }
  }
}
