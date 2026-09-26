/**
 * @file server.js
 * @description Application entry point: initializes services, HTTP server, and Socket.IO
 */

import http from 'node:http';
import { APP_CONFIG } from './server/config/appConfig.js';
import { createApp } from './server/app.js';
import { UserService } from './server/services/UserService.js';
import { RoomService } from './server/services/RoomService.js';
import { ChatService } from './server/services/ChatService.js';
import { DocumentService } from './server/services/DocumentService.js';
import { SocketManager } from './server/sockets/socketManager.js';

async function bootstrap() {
  try {
    // 1. Initialize Service Layer
    const userService = new UserService();
    const roomService = new RoomService();
    const chatService = new ChatService();
    const documentService = new DocumentService();

    const services = {
      userService,
      roomService,
      chatService,
      documentService,
    };

    // 2. Initialize Web App & HTTP Server
    const app = createApp(services);
    const httpServer = http.createServer(app);

    // 3. Attach Real-Time Socket.IO Manager
    const socketManager = new SocketManager(httpServer, services);

    // 4. Start Listening
    httpServer.listen(APP_CONFIG.PORT, APP_CONFIG.HOST, () => {
      console.log('='.repeat(60));
      console.log('🚀 NexusCollab - Real-Time Collaboration Workspace');
      console.log(`🌐 Server running at: http://${APP_CONFIG.HOST}:${APP_CONFIG.PORT}`);
      console.log(`📡 WebSocket endpoint active`);
      console.log(`⚡ Environment: ${APP_CONFIG.ENV}`);
      console.log('='.repeat(60));
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\n[NexusCollab] Gracefully shutting down server...');
      socketManager.getIO().close(() => {
        httpServer.close(() => {
          console.log('[NexusCollab] Server stopped. Goodbye!');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
