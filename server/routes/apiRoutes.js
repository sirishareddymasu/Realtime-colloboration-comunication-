/**
 * @file apiRoutes.js
 * @description REST API routes for health checks, system metrics, and document exporting
 */

import { Router } from 'express';

/**
 * Creates API router with injected services
 * @param {Object} services
 * @param {import('../services/UserService.js').UserService} services.userService
 * @param {import('../services/RoomService.js').RoomService} services.roomService
 * @param {import('../services/DocumentService.js').DocumentService} services.documentService
 * @returns {Router}
 */
export function createApiRoutes({ userService, roomService, documentService }) {
  const router = Router();

  // Health probe
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // Workspace stats
  router.get('/stats', (req, res) => {
    res.json({
      onlineUsers: userService.getConnectedCount(),
      totalDocuments: documentService.getAllDocuments().length,
      totalRooms: roomService.getAllRooms().length,
    });
  });

  // Get all documents metadata
  router.get('/documents', (req, res) => {
    res.json(documentService.getAllDocuments());
  });

  // Get specific document
  router.get('/documents/:id', (req, res) => {
    const doc = documentService.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc.toJSON(true));
  });

  // Export document as file (markdown, HTML, or raw text)
  router.get('/documents/:id/export', (req, res) => {
    const doc = documentService.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const format = (req.query.format || 'markdown').toLowerCase();
    const safeTitle = doc.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.html"`);
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #222; }
    pre { background: #f4f4f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <pre>${doc.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`);
    }

    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.txt"`);
      return res.send(doc.content);
    }

    // Default to markdown
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.md"`);
    return res.send(doc.content);
  });

  // Get all rooms
  router.get('/rooms', (req, res) => {
    res.json(roomService.getAllRooms());
  });

  return router;
}
