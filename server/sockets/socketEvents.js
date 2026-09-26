/**
 * @file socketEvents.js
 * @description Centralized Socket.IO event dictionary to avoid magic strings and ensure type safety
 */

export const SOCKET_EVENTS = {
  // Connection & Presence
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  USER_JOIN: 'presence:user_join',
  USER_UPDATE_STATUS: 'presence:status_update',
  USER_UPDATE_FOCUS: 'presence:focus_update',
  USERS_SYNC: 'presence:users_sync',
  USER_POINTER_MOVE: 'presence:pointer_move',
  USER_POINTER_SYNC: 'presence:pointer_sync',

  // Chat & Communication
  CHAT_JOIN_ROOM: 'chat:join_room',
  CHAT_LEAVE_ROOM: 'chat:leave_room',
  CHAT_SEND_MESSAGE: 'chat:send_message',
  CHAT_RECEIVE_MESSAGE: 'chat:receive_message',
  CHAT_TYPING_INDICATOR: 'chat:typing',
  CHAT_REACTION_TOGGLE: 'chat:reaction_toggle',
  CHAT_REACTION_UPDATE: 'chat:reaction_update',
  CHAT_ROOM_CREATE: 'chat:room_create',
  CHAT_ROOMS_SYNC: 'chat:rooms_sync',

  // Collaborative Documents
  DOC_JOIN: 'doc:join',
  DOC_LEAVE: 'doc:leave',
  DOC_LOAD: 'doc:load',
  DOC_CHANGE: 'doc:change',
  DOC_SYNC: 'doc:sync',
  DOC_CURSOR_MOVE: 'doc:cursor_move',
  DOC_CURSOR_SYNC: 'doc:cursor_sync',
  DOC_CHECKPOINT_CREATE: 'doc:checkpoint_create',
  DOC_CHECKPOINT_RESTORE: 'doc:checkpoint_restore',
  DOC_CREATE: 'doc:create',
  DOC_LIST_SYNC: 'doc:list_sync',

  // System Notifications
  SYSTEM_NOTIFICATION: 'system:notification',
  ERROR: 'system:error',
};
