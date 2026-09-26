/**
 * @file HeaderView.js
 * @description View controller for the top workspace header and user presence bar
 */

export class HeaderView {
  /**
   * @param {Object} options
   * @param {import('../../core/Store.js').Store} options.store
   * @param {import('../../core/EventEmitter.js').EventEmitter} options.events
   * @param {import('../../services/AudioService.js').AudioService} options.audio
   */
  constructor({ store, events, audio }) {
    this.store = store;
    this.events = events;
    this.audio = audio;

    this.container = document.querySelector('.app-header');
    this._bindElements();
    this._attachListeners();
    this.render();
  }

  _bindElements() {
    this.syncBadge = document.getElementById('header-sync-status');
    this.docBadge = document.getElementById('header-active-doc');
    this.avatarStack = document.getElementById('header-avatar-stack');
    this.soundToggleBtn = document.getElementById('header-sound-toggle');
    this.chatToggleBtn = document.getElementById('header-chat-toggle');
    this.cloneBtn = document.getElementById('header-clone-tab');
    this.profileBtn = document.getElementById('header-profile-btn');
  }

  _attachListeners() {
    // Sound toggle
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        const current = this.store.getState().soundEnabled;
        const next = !current;
        this.audio.setEnabled(next);
        this.store.setState({ soundEnabled: next });
        this.events.emit('sound_toggled', next);
      });
    }

    // Toggle right chat panel
    if (this.chatToggleBtn) {
      this.chatToggleBtn.addEventListener('click', () => {
        const chatPanel = document.querySelector('.app-chat-panel');
        if (chatPanel) {
          chatPanel.classList.toggle('collapsed');
          const isCollapsed = chatPanel.classList.contains('collapsed');
          this.chatToggleBtn.classList.toggle('active', !isCollapsed);
        }
      });
    }

    // Clone tab / new collaborator persona test
    if (this.cloneBtn) {
      this.cloneBtn.addEventListener('click', () => {
        const randId = Math.floor(100 + Math.random() * 900);
        const cloneUrl = `${window.location.origin}${window.location.pathname}?collab_test=${randId}`;
        window.open(cloneUrl, '_blank', 'width=1100,height=800');
      });
    }

    // Profile modal trigger
    if (this.profileBtn) {
      this.profileBtn.addEventListener('click', () => {
        this.events.emit('open_modal', { type: 'profile' });
      });
    }

    // Subscribe to state updates
    this.store.subscribe(({ state }) => {
      this.render();
    });
  }

  render() {
    const { currentUser, users, currentDoc, syncStatus, soundEnabled } = this.store.getState();

    // 1. Sync badge
    if (this.syncBadge) {
      if (syncStatus === 'syncing') {
        this.syncBadge.className = 'sync-status-badge syncing';
        this.syncBadge.innerHTML = `<span class="sync-dot"></span> Syncing`;
      } else {
        this.syncBadge.className = 'sync-status-badge';
        this.syncBadge.innerHTML = `<span class="sync-dot"></span> Live`;
      }
    }

    // 2. Document title badge
    if (this.docBadge) {
      this.docBadge.textContent = currentDoc ? currentDoc.title : 'Nexus Workspace';
    }

    // 3. Sound toggle button icon
    if (this.soundToggleBtn) {
      this.soundToggleBtn.innerHTML = soundEnabled ? '🔔' : '🔕';
      this.soundToggleBtn.title = soundEnabled ? 'Sound Effects: On' : 'Sound Effects: Muted';
      this.soundToggleBtn.classList.toggle('active', soundEnabled);
    }

    // 4. User profile pill
    if (this.profileBtn && currentUser) {
      const avatarEl = this.profileBtn.querySelector('.user-avatar-self');
      const nameEl = this.profileBtn.querySelector('.user-name-self');
      const dotEl = this.profileBtn.querySelector('.status-indicator-self');

      if (avatarEl) {
        avatarEl.style.backgroundColor = currentUser.color;
        avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
      }
      if (nameEl) {
        nameEl.textContent = currentUser.name;
      }
      if (dotEl) {
        dotEl.className = `status-indicator-self status-${currentUser.status}`;
      }
    }

    // 5. Collaborators stack
    if (this.avatarStack) {
      this.avatarStack.innerHTML = '';
      const visibleUsers = users.slice(0, 5);

      visibleUsers.forEach((user) => {
        const avatar = document.createElement('div');
        avatar.className = 'collab-avatar';
        avatar.style.backgroundColor = user.color;
        avatar.title = `${user.name} (${user.status}) - ${user.currentFocus || 'Viewing'}`;
        avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
        this.avatarStack.appendChild(avatar);
      });

      if (users.length > 5) {
        const overflow = document.createElement('div');
        overflow.className = 'collab-overflow-badge';
        overflow.textContent = `+${users.length - 5}`;
        this.avatarStack.appendChild(overflow);
      }
    }
  }
}
