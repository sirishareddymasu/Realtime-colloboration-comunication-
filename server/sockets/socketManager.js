/**
 * @file socketManager.js
 * @description Central Socket.IO initialization and handler delegation adhering to Dependency Injection
 */

import { Server } from 'socket.io';
import { APP_CONFIG } from '../config/appConfig.js';
import { registerPresenceHandler } from './handlers/presenceHandler.js';
import { registerChatHandler } from './handlers/chatHandler.js';
import { registerDocumentHandler } from './handlers/documentHandler.js';

export class SocketManager {
  /**
   * @param {import('node:http').Server} httpServer
   * @param {Object} services
   * @param {import('../services/UserService.js').UserService} services.userService
   * @param {import('../services/RoomService.js').RoomService} services.roomService
   * @param {import('../services/ChatService.js').ChatService} services.chatService
   * @param {import('../services/DocumentService.js').DocumentService} services.documentService
   */
  constructor(httpServer, { userService, roomService, chatService, documentService }) {
    this.io = new Server(httpServer, {
      cors: {
        origin: APP_CONFIG.CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    this.userService = userService;
    this.roomService = roomService;
    this.chatService = chatService;
    this.documentService = documentService;

    this._initialize();
  }

  _initialize() {
    this.io.on('connection', (socket) => {
      // Register modular domain handlers
      registerPresenceHandler(this.io, socket, this.userService, this.documentService);
      registerChatHandler(this.io, socket, this.chatService, this.roomService, this.userService);
      registerDocumentHandler(this.io, socket, this.documentService, this.userService);
    });
  }

  /**
   * @returns {import('socket.io').Server}
   */
  getIO() {
    return this.io;
  }
}
