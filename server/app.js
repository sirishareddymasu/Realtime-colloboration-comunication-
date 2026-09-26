/**
 * @file app.js
 * @description Express application setup, middlewares, and routing configuration
 */

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRoutes } from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/**
 * Configure Express application
 * @param {Object} services
 * @returns {express.Application}
 */
export function createApp(services) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static assets
  app.use(express.static(PUBLIC_DIR));

  // REST API routes
  app.use('/api', createApiRoutes(services));

  // Fallback to index.html for SPA routing (Express 5 compatible)
  app.use((req, res, next) => {
    // If request accepts html and was not handled by static or API routes
    if (req.accepts('html')) {
      res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    } else {
      next();
    }
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('[App Error]', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  return app;
}
