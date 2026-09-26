/**
 * @file appConfig.js
 * @description Centralized server configuration constants
 */

export const APP_CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: '*',
  DOCUMENTS: {
    MAX_SNAPSHOT_HISTORY: 50,
    AUTO_CHECKPOINT_INTERVAL_MS: 300000, // 5 minutes
  },
  CHAT: {
    MAX_HISTORY_PER_ROOM: 200,
    MAX_MESSAGE_LENGTH: 5000,
    TYPING_TIMEOUT_MS: 3000,
  },
  PRESENCE: {
    HEARTBEAT_INTERVAL_MS: 30000,
  },
};
