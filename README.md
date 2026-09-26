# 🚀 NexusCollab — Real-Time Collaboration & Communication Workspace

A modern, high-performance, full-stack real-time collaboration workspace built with **Clean Architecture**, **SOLID principles**, and **sub-millisecond WebSocket synchronization**.

---

## 🌟 Key Features

### 1. 📝 Real-Time Collaborative Document Editor
- **Multi-User Live Editing**: Simultaneous typing synchronization without cursor jumping.
- **Remote Cursors & Selection**: Collaborators' colored carets and text selections update live.
- **Version Checkpoints & Reversion**: Save named snapshots and restore any historical version with 1-click.
- **Dual View Modes**: Switch between **Editor**, **Split Mode**, and **Live Markdown Preview**.
- **Document Management**: Create new documents, switch between files, and export as Markdown (`.md`).

### 2. 💬 Real-Time Team Communication & Channels
- **Multi-Channel Chat**: Switch between channels (e.g., `#general`, `#engineering`, `#design-sync`) or create new channels.
- **Markdown & Code Snippets**: Formatted messages with inline code, bold, italics, and block formatting.
- **Live Typing Indicators**: Responsive indicators ("Alex & Elena are typing...").
- **Emoji Reactions**: Interactive hover reaction bar (`👍`, `❤️`, `🚀`, `🎉`, `🔥`, `👀`) with live counts.
- **Micro-Audio Feedback**: Pleasant audio pings and chimes synthesized via the native **Web Audio API** (toggleable).

### 3. 👥 Active Team Presence & Pointer Radar
- **Live User Roster**: Dynamic team list with status badges (**Active** 🟢, **In Meeting** 🟣, **Busy** 🔴, **Away** 🟡).
- **Workspace Pointer Radar**: Live collaborator mouse positions glide across the screen with custom colored name tags.
- **One-Click Persona Clone**: Click **"Clone Persona"** in the top header to instantly launch a new collaborator tab in another window to test real-time synchronization.

---

## 🏗️ Clean Code Architecture

```
Fullstackkk/
├── server.js                          # HTTP Server & WebSocket bootstrap
├── server/
│   ├── config/
│   │   └── appConfig.js               # Centralized configuration & constants
│   ├── domain/                        # Domain Layer (Pure Entities & Business Rules)
│   │   ├── User.js                    # User profile, presence, and focus
│   │   ├── Room.js                    # Chat channel / topic entity
│   │   ├── Message.js                 # Chat message with emoji reaction model
│   │   └── Document.js                # Live collaborative document with snapshots
│   ├── services/                      # Application Service Layer (Workflows)
│   │   ├── UserService.js             # Presence & user lifecycle
│   │   ├── RoomService.js             # Channel management
│   │   ├── ChatService.js             # Message buffer & emoji reactions
│   │   └── DocumentService.js         # Document synchronization & checkpoints
│   ├── sockets/                       # Real-Time WebSocket Infrastructure
│   │   ├── socketEvents.js            # Centralized event dictionary
│   │   ├── socketManager.js           # Dependency injection & socket routing
│   │   └── handlers/                  # Dedicated event handlers
│   │       ├── presenceHandler.js     # User presence, status & pointer radar
│   │       ├── chatHandler.js         # Channels, messaging & typing
│   │       └── documentHandler.js     # Document sync, cursors & checkpoints
│   └── routes/
│       └── apiRoutes.js               # REST API endpoints (Health, Stats, Export)
└── public/                            # Presentation Layer (Vanilla JS & Modern CSS)
    ├── index.html                     # Semantic, accessible HTML5 layout
    ├── css/
    │   ├── variables.css              # Design tokens & glassmorphic themes
    │   ├── base.css                   # Typography, scrollbar & animations
    │   ├── layout.css                 # Responsive workspace grid
    │   └── components/                # Modular component stylesheets
    └── js/
        ├── config/constants.js        # Client constants & event names
        ├── core/                      # Core reactive infrastructure
        │   ├── EventEmitter.js        # Decoupled Pub/Sub event bus
        │   └── Store.js               # Centralized reactive state store
        ├── services/                  # Client services
        │   ├── SocketService.js       # Typed WebSocket client with Promises
        │   ├── AudioService.js        # Web Audio API sound synthesizer
        │   └── StorageService.js      # LocalStorage preferences persistence
        ├── ui/                        # UI View Controllers
        │   ├── Toast.js               # Non-intrusive alert toasts
        │   └── components/            # Header, Sidebar, Editor, Chat, Cursors, Modals
        └── app.js                     # Main application orchestrator
```

---

## 🚀 Running Locally

1. **Start the Server**:
   ```bash
   npm start
   ```
2. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).
3. **Simulate Multiple Users**:
   - Open [http://localhost:3000](http://localhost:3000) in two tabs or windows.
   - Or click the **"👥 Clone Persona"** button in the header toolbar.
   - Start typing in the document or chat and watch instant real-time sync across both windows!
