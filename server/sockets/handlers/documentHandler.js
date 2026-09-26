/**
 * @file documentHandler.js
 * @description Socket event handler managing real-time document sync, cursor tracking, and checkpoints
 */

import { SOCKET_EVENTS } from '../socketEvents.js';

/**
 * Register document socket events
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../../services/DocumentService.js').DocumentService} documentService
 * @param {import('../../services/UserService.js').UserService} userService
 */
export function registerDocumentHandler(io, socket, documentService, userService) {
  // Join a document session
  socket.on(SOCKET_EVENTS.DOC_JOIN, ({ docId }, callback) => {
    const doc = documentService.getDocument(docId);
    if (!doc) {
      if (typeof callback === 'function') callback({ success: false, error: 'Document not found' });
      return;
    }

    const docSocketGroup = `doc:${docId}`;
    socket.join(docSocketGroup);

    const user = userService.getUser(socket.id);
    if (user) {
      userService.updateFocus(socket.id, `Editing: ${doc.title}`);
      io.emit(SOCKET_EVENTS.USERS_SYNC, userService.getAllUsers());
    }

    if (typeof callback === 'function') {
      callback({
        success: true,
        document: doc.toJSON(true),
      });
    }
  });

  // Leave a document session
  socket.on(SOCKET_EVENTS.DOC_LEAVE, ({ docId }) => {
    socket.leave(`doc:${docId}`);
    const updatedCursors = documentService.removeCursor(docId, socket.id);
    socket.to(`doc:${docId}`).emit(SOCKET_EVENTS.DOC_CURSOR_SYNC, {
      docId,
      cursors: updatedCursors,
    });
  });

  // Collaborative text change
  socket.on(SOCKET_EVENTS.DOC_CHANGE, ({ docId, content, clientVersion }, callback) => {
    const user = userService.getUser(socket.id);
    const author = user ? { id: user.id, name: user.name, color: user.color } : { name: 'Collaborator' };

    const updateResult = documentService.applyUpdate(docId, content, author);
    if (!updateResult) {
      if (typeof callback === 'function') callback({ success: false, error: 'Document not found' });
      return;
    }

    // Broadcast the updated content and version to all other collaborators in this document room
    socket.to(`doc:${docId}`).emit(SOCKET_EVENTS.DOC_SYNC, {
      docId,
      content,
      version: updateResult.version,
      updatedAt: updateResult.updatedAt,
      author,
      sourceSocketId: socket.id,
    });

    if (typeof callback === 'function') {
      callback({
        success: true,
        version: updateResult.version,
        updatedAt: updateResult.updatedAt,
      });
    }
  });

  // Move remote cursor / selection inside document
  socket.on(SOCKET_EVENTS.DOC_CURSOR_MOVE, ({ docId, line, ch, selection }) => {
    const user = userService.getUser(socket.id);
    if (!user) return;

    const cursors = documentService.updateCursor(docId, socket.id, user, line, ch, selection);

    // Broadcast to other collaborators viewing this document
    socket.to(`doc:${docId}`).emit(SOCKET_EVENTS.DOC_CURSOR_SYNC, {
      docId,
      cursors,
    });
  });

  // Create manual checkpoint
  socket.on(SOCKET_EVENTS.DOC_CHECKPOINT_CREATE, ({ docId, title }, callback) => {
    const user = userService.getUser(socket.id);
    const author = user ? { id: user.id, name: user.name, color: user.color } : { name: 'User' };

    const checkpoint = documentService.createCheckpoint(docId, title, author);
    if (checkpoint) {
      const doc = documentService.getDocument(docId);
      io.to(`doc:${docId}`).emit(SOCKET_EVENTS.DOC_CHECKPOINT_CREATE, {
        docId,
        checkpoint,
        checkpoints: doc.checkpoints,
      });

      if (typeof callback === 'function') {
        callback({ success: true, checkpoint });
      }
    } else if (typeof callback === 'function') {
      callback({ success: false, error: 'Document not found' });
    }
  });

  // Revert document to a past checkpoint
  socket.on(SOCKET_EVENTS.DOC_CHECKPOINT_RESTORE, ({ docId, checkpointId }, callback) => {
    const user = userService.getUser(socket.id);
    const author = user ? { id: user.id, name: user.name, color: user.color } : { name: 'User' };

    const result = documentService.revertToCheckpoint(docId, checkpointId, author);
    if (result) {
      // Broadcast updated document state to all users in room
      io.to(`doc:${docId}`).emit(SOCKET_EVENTS.DOC_SYNC, {
        docId,
        content: result.document.content,
        version: result.document.version,
        updatedAt: result.document.updatedAt,
        author,
        isReversion: true,
        restoredCheckpoint: result.restoredCheckpoint,
      });

      // Update checkpoint list
      io.to(`doc:${docId}`).emit(SOCKET_EVENTS.DOC_CHECKPOINT_CREATE, {
        docId,
        checkpoints: result.document.checkpoints,
      });

      if (typeof callback === 'function') {
        callback({ success: true, document: result.document });
      }
    } else if (typeof callback === 'function') {
      callback({ success: false, error: 'Checkpoint not found' });
    }
  });

  // Create new document
  socket.on(SOCKET_EVENTS.DOC_CREATE, ({ title, language, initialContent }, callback) => {
    const user = userService.getUser(socket.id);
    const author = user ? { id: user.id, name: user.name, color: user.color } : { name: 'Creator' };

    const doc = documentService.createDocument(title, language, initialContent, author);
    io.emit(SOCKET_EVENTS.DOC_LIST_SYNC, documentService.getAllDocuments());

    if (typeof callback === 'function') {
      callback({ success: true, document: doc.toJSON(true) });
    }
  });
}
