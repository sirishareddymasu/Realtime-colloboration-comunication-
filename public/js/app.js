/**
 * @file app.js
 * @description Main application orchestrator following Clean Architecture principles
 */

import { Store } from './core/Store.js';
import { EventEmitter } from './core/EventEmitter.js';
import { StorageService } from './services/StorageService.js';
import { AudioService } from './services/AudioService.js';
import { SocketService } from './services/SocketService.js';
import { USER_COLORS, SOCKET_EVENTS } from './config/constants.js';
import { Toast } from './ui/Toast.js';

import { HeaderView } from './ui/components/HeaderView.js';
import { SidebarView } from './ui/components/SidebarView.js';
import { EditorView } from './ui/components/EditorView.js';
import { ChatView } from './ui/components/ChatView.js';
import { CursorOverlay } from './ui/components/CursorOverlay.js';
import { ModalView } from './ui/components/ModalView.js';

class NexusCollabApp {
  constructor() {
    this.events = new EventEmitter();
    this.store = new Store();
    this.audio = new AudioService();
    this.socket = new SocketService();
  }

  async init() {
    console.log('[NexusCollab] Initializing workspace application...');

    // 1. Initialize user profile
    this._initUserProfile();

    // 2. Initialize sound settings
    const soundEnabled = StorageService.getSoundEnabled();
    this.audio.setEnabled(soundEnabled);
    this.store.setState({ soundEnabled });

    // 3. Connect Socket.IO
    this._bindSocketEvents();
    this.socket.connect();

    // 4. Initialize UI Components
    this._initUIComponents();

    // 5. Wire UI events to Socket/Store
    this._wireInteractions();
  }

  /**
   * Loads saved profile or derives a fresh collaborator persona
   * @private
   */
  _initUserProfile() {
    let profile = StorageService.getProfile(USER_COLORS);

    // Support quick multi-tab testing via query parameter "?collab_test=123"
    const params = new URLSearchParams(window.location.search);
    const testPersona = params.get('collab_test');
    if (testPersona) {
      const personaNames = ['Alex Rivera', 'Elena Vance', 'Jordan Reed', 'Samira Khan', 'Liam O’Connor'];
      const randomName = personaNames[Math.floor(Math.random() * personaNames.length)] + ` #${testPersona}`;
      const randomColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      profile = {
        id: `usr-test-${testPersona}`,
        name: randomName,
        color: randomColor,
        status: 'active',
      };
    }

    this.store.setState({ currentUser: profile });
  }

  /**
   * Bind incoming real-time socket events
   * @private
   */
  _bindSocketEvents() {
    // Connection established
    this.socket.on('connection_status', async ({ connected }) => {
      if (connected) {
        const { currentUser } = this.store.getState();
        // Register user identity
        await this.socket.emitAsync(SOCKET_EVENTS.USER_JOIN, currentUser);

        // Fetch initial documents and channels
        this._fetchInitialData();
      } else {
        this.store.setState({ syncStatus: 'offline' });
        Toast.warning('Disconnected from server. Reconnecting...');
      }
    });

    // Active users presence sync
    this.socket.on(SOCKET_EVENTS.USERS_SYNC, (users) => {
      this.store.setState({ users });
    });

    // Canvas pointer radar
    this.socket.on(SOCKET_EVENTS.USER_POINTER_SYNC, (pointerData) => {
      this.events.emit('remote_pointer_sync', pointerData);
    });

    // Remote document text synchronization
    this.socket.on(SOCKET_EVENTS.DOC_SYNC, (syncData) => {
      const { currentDoc } = this.store.getState();
      if (currentDoc && currentDoc.id === syncData.docId) {
        this.store.setState(
          {
            currentDoc: {
              ...currentDoc,
              content: syncData.content,
              version: syncData.version,
              updatedAt: syncData.updatedAt,
              lastModifiedBy: syncData.author,
            },
            syncStatus: 'synced',
          },
          'REMOTE_DOC_SYNC'
        );

        if (syncData.isReversion) {
          this.audio.playRevert();
          Toast.info(`Document restored to: "${syncData.restoredCheckpoint.title}"`);
        }
      }
    });

    // Document checkpoint created
    this.socket.on(SOCKET_EVENTS.DOC_CHECKPOINT_CREATE, ({ docId, checkpoint, checkpoints }) => {
      const { currentDoc } = this.store.getState();
      if (currentDoc && currentDoc.id === docId) {
        this.store.setState({
          currentDoc: {
            ...currentDoc,
            checkpoints,
          },
        });
        this.audio.playCheckpoint();
        Toast.success(`New checkpoint saved: "${checkpoint.title}"`);
      }
    });

    // Document list sync
    this.socket.on(SOCKET_EVENTS.DOC_LIST_SYNC, (documents) => {
      this.store.setState({ documents });
    });

    // Chat message received
    this.socket.on(SOCKET_EVENTS.CHAT_RECEIVE_MESSAGE, (message) => {
      const { currentRoomId, messages, currentUser } = this.store.getState();
      if (message.roomId === currentRoomId) {
        this.store.setState(
          { messages: [...messages, message] },
          'NEW_MESSAGE_RECEIVED'
        );

        // Sound chime if message was from someone else
        if (!currentUser || message.user.id !== currentUser.id) {
          this.audio.playMessage();
        }
      }
    });

    // Chat typing status
    this.socket.on(SOCKET_EVENTS.CHAT_TYPING_INDICATOR, ({ roomId, typingUsers }) => {
      const { currentRoomId } = this.store.getState();
      if (roomId === currentRoomId) {
        this.store.setState({ typingUsers }, 'TYPING_UPDATED');
      }
    });

    // Chat emoji reactions update
    this.socket.on(SOCKET_EVENTS.CHAT_REACTION_UPDATE, ({ roomId, messageId, reactions }) => {
      const { currentRoomId, messages } = this.store.getState();
      if (roomId === currentRoomId) {
        const updated = messages.map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        );
        this.store.setState({ messages: updated }, 'REACTIONS_UPDATED');
      }
    });

    // Chat rooms list sync
    this.socket.on(SOCKET_EVENTS.CHAT_ROOMS_SYNC, (rooms) => {
      this.store.setState({ rooms });
    });

    // System notifications
    this.socket.on(SOCKET_EVENTS.SYSTEM_NOTIFICATION, ({ type, message }) => {
      if (type === 'info') {
        this.audio.playUserJoin();
        Toast.info(message);
      } else {
        Toast.show({ message, type });
      }
    });
  }

  /**
   * Fetch initial workspace seed data (rooms, documents, and join defaults)
   * @private
   */
  async _fetchInitialData() {
    try {
      // 1. Fetch rooms
      const roomsRes = await fetch('/api/rooms');
      const rooms = await roomsRes.json();
      this.store.setState({ rooms });

      // Join default room (#general)
      if (rooms.length > 0) {
        this.selectRoom(rooms[0].id);
      }

      // 2. Fetch documents
      const docsRes = await fetch('/api/documents');
      const documents = await docsRes.json();
      this.store.setState({ documents });

      // Join first document
      if (documents.length > 0) {
        this.selectDocument(documents[0].id);
      }
    } catch (e) {
      console.error('Failed to load initial workspace data:', e);
    }
  }

  /**
   * Wire client UI events
   * @private
   */
  _wireInteractions() {
    // Document text change
    this.events.on('local_doc_change', async ({ docId, content, clientVersion }) => {
      try {
        const res = await this.socket.emitAsync(SOCKET_EVENTS.DOC_CHANGE, {
          docId,
          content,
          clientVersion,
        });
        if (res.success) {
          const { currentDoc } = this.store.getState();
          this.store.setState({
            currentDoc: {
              ...currentDoc,
              content,
              version: res.version,
              updatedAt: res.updatedAt,
            },
            syncStatus: 'synced',
          });
        }
      } catch (err) {
        console.error('Failed to sync document change:', err);
      }
    });

    // Cursor position in document
    this.events.on('local_cursor_move', (cursorData) => {
      this.socket.emit(SOCKET_EVENTS.DOC_CURSOR_MOVE, cursorData);
    });

    // Pointer move across screen
    this.events.on('local_pointer_move', (coords) => {
      this.socket.emit(SOCKET_EVENTS.USER_POINTER_MOVE, coords);
    });

    // Switch active document
    this.events.on('select_document', (docId) => {
      this.selectDocument(docId);
    });

    // Switch active room
    this.events.on('select_room', (roomId) => {
      this.selectRoom(roomId);
    });

    // Send chat message
    this.events.on('local_send_message', async ({ roomId, text }) => {
      try {
        await this.socket.emitAsync(SOCKET_EVENTS.CHAT_SEND_MESSAGE, { roomId, text });
      } catch (err) {
        Toast.error(err.message);
      }
    });

    // Typing status
    this.events.on('local_typing_status', (isTyping) => {
      const { currentRoomId } = this.store.getState();
      this.socket.emit(SOCKET_EVENTS.CHAT_TYPING_INDICATOR, {
        roomId: currentRoomId,
        isTyping,
      });
    });

    // Toggle reaction
    this.events.on('local_reaction_toggle', ({ roomId, messageId, emoji }) => {
      this.socket.emit(SOCKET_EVENTS.CHAT_REACTION_TOGGLE, {
        roomId,
        messageId,
        emoji,
      });
    });

    // Create checkpoint
    this.events.on('local_create_checkpoint', async ({ docId, title }) => {
      try {
        await this.socket.emitAsync(SOCKET_EVENTS.DOC_CHECKPOINT_CREATE, { docId, title });
      } catch (err) {
        Toast.error(err.message);
      }
    });

    // Revert checkpoint
    this.events.on('local_revert_checkpoint', async ({ docId, checkpointId }) => {
      try {
        await this.socket.emitAsync(SOCKET_EVENTS.DOC_CHECKPOINT_RESTORE, { docId, checkpointId });
      } catch (err) {
        Toast.error(err.message);
      }
    });

    // Create document
    this.events.on('local_create_doc', async ({ title, language, initialContent }) => {
      try {
        const res = await this.socket.emitAsync(SOCKET_EVENTS.DOC_CREATE, {
          title,
          language,
          initialContent,
        });
        if (res.success && res.document) {
          Toast.success(`Created "${res.document.title}"`);
          this.selectDocument(res.document.id);
        }
      } catch (err) {
        Toast.error(err.message);
      }
    });

    // Create channel
    this.events.on('local_create_room', async ({ name, topic }) => {
      try {
        const res = await this.socket.emitAsync(SOCKET_EVENTS.CHAT_ROOM_CREATE, { name, topic });
        if (res.success && res.room) {
          Toast.success(`Created channel "${res.room.name}"`);
          this.selectRoom(res.room.id);
        }
      } catch (err) {
        Toast.error(err.message);
      }
    });

    // Update profile
    this.events.on('local_update_profile', (profile) => {
      StorageService.saveProfile(profile);
      this.store.setState({ currentUser: profile });
      this.socket.emit(SOCKET_EVENTS.USER_UPDATE_STATUS, { status: profile.status });
      Toast.success('Profile preferences updated');
    });
  }

  /**
   * Switch active collaborative document
   * @param {string} docId
   */
  async selectDocument(docId) {
    const { currentDoc } = this.store.getState();
    if (currentDoc && currentDoc.id === docId) return;

    if (currentDoc) {
      this.socket.emit(SOCKET_EVENTS.DOC_LEAVE, { docId: currentDoc.id });
    }

    try {
      const res = await this.socket.emitAsync(SOCKET_EVENTS.DOC_JOIN, { docId });
      if (res.success && res.document) {
        this.store.setState(
          {
            currentDoc: res.document,
            syncStatus: 'synced',
          },
          'DOC_LOADED'
        );
      }
    } catch (err) {
      Toast.error(`Could not open document: ${err.message}`);
    }
  }

  /**
   * Switch active chat channel
   * @param {string} roomId
   */
  async selectRoom(roomId) {
    const { currentRoomId } = this.store.getState();
    if (currentRoomId && currentRoomId !== roomId) {
      this.socket.emit(SOCKET_EVENTS.CHAT_LEAVE_ROOM, { roomId: currentRoomId });
    }

    try {
      const res = await this.socket.emitAsync(SOCKET_EVENTS.CHAT_JOIN_ROOM, { roomId });
      if (res.success) {
        this.store.setState(
          {
            currentRoomId: roomId,
            messages: res.messages || [],
            typingUsers: [],
          },
          'ROOM_CHANGED'
        );
      }
    } catch (err) {
      Toast.error(`Could not join room: ${err.message}`);
    }
  }

  /**
   * Instantiate UI Controllers
   * @private
   */
  _initUIComponents() {
    new HeaderView({ store: this.store, events: this.events, audio: this.audio });
    new SidebarView({ store: this.store, events: this.events });
    new EditorView({ store: this.store, events: this.events });
    new ChatView({ store: this.store, events: this.events, audio: this.audio });
    new CursorOverlay({ store: this.store, events: this.events });
    new ModalView({ store: this.store, events: this.events, storage: StorageService });
  }
}

// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new NexusCollabApp();
  app.init().catch(console.error);
});
