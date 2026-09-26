/**
 * @file SidebarView.js
 * @description View controller for sidebar containing documents, channels, and team presence roster
 */

export class SidebarView {
  /**
   * @param {Object} options
   * @param {import('../../core/Store.js').Store} options.store
   * @param {import('../../core/EventEmitter.js').EventEmitter} options.events
   */
  constructor({ store, events }) {
    this.store = store;
    this.events = events;
    this.activeTab = 'docs'; // 'docs' | 'channels' | 'team'

    this._bindElements();
    this._attachListeners();
    this.render();
  }

  _bindElements() {
    this.tabDocs = document.getElementById('tab-btn-docs');
    this.tabChannels = document.getElementById('tab-btn-channels');
    this.tabTeam = document.getElementById('tab-btn-team');

    this.docsContent = document.getElementById('sidebar-docs-content');
    this.channelsContent = document.getElementById('sidebar-channels-content');
    this.teamContent = document.getElementById('sidebar-team-content');

    this.docsList = document.getElementById('sidebar-docs-list');
    this.channelsList = document.getElementById('sidebar-channels-list');
    this.teamList = document.getElementById('sidebar-team-list');

    this.btnNewDoc = document.getElementById('btn-new-doc');
    this.btnNewChannel = document.getElementById('btn-new-channel');
    this.onlineCountBadge = document.getElementById('sidebar-online-count');
  }

  _attachListeners() {
    // Tab switching
    if (this.tabDocs) {
      this.tabDocs.addEventListener('click', () => this.switchTab('docs'));
    }
    if (this.tabChannels) {
      this.tabChannels.addEventListener('click', () => this.switchTab('channels'));
    }
    if (this.tabTeam) {
      this.tabTeam.addEventListener('click', () => this.switchTab('team'));
    }

    // Modal triggers for creation
    if (this.btnNewDoc) {
      this.btnNewDoc.addEventListener('click', () => {
        this.events.emit('open_modal', { type: 'new_doc' });
      });
    }

    if (this.btnNewChannel) {
      this.btnNewChannel.addEventListener('click', () => {
        this.events.emit('open_modal', { type: 'new_channel' });
      });
    }

    // State changes
    this.store.subscribe(({ state }) => {
      this.render();
    });
  }

  /**
   * Switch active sidebar tab
   * @param {'docs'|'channels'|'team'} tabName
   */
  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    if (this.tabDocs) this.tabDocs.classList.toggle('active', tabName === 'docs');
    if (this.tabChannels) this.tabChannels.classList.toggle('active', tabName === 'channels');
    if (this.tabTeam) this.tabTeam.classList.toggle('active', tabName === 'team');

    // Update tab panels
    if (this.docsContent) this.docsContent.style.display = tabName === 'docs' ? 'flex' : 'none';
    if (this.channelsContent) this.channelsContent.style.display = tabName === 'channels' ? 'flex' : 'none';
    if (this.teamContent) this.teamContent.style.display = tabName === 'team' ? 'flex' : 'none';
  }

  render() {
    const { documents, currentDoc, rooms, currentRoomId, users } = this.store.getState();

    // 1. Render Documents List
    if (this.docsList) {
      this.docsList.innerHTML = '';
      documents.forEach((doc) => {
        const item = document.createElement('div');
        const isActive = currentDoc && currentDoc.id === doc.id;
        item.className = `nav-item ${isActive ? 'active' : ''}`;
        
        const docIcon = doc.language === 'javascript' ? '⚡' : '📄';

        item.innerHTML = `
          <div class="nav-item-left">
            <span class="nav-item-icon">${docIcon}</span>
            <span class="nav-item-name">${doc.title}</span>
          </div>
          <span class="nav-item-badge">v${doc.version || 1}</span>
        `;

        item.addEventListener('click', () => {
          this.events.emit('select_document', doc.id);
        });

        this.docsList.appendChild(item);
      });
    }

    // 2. Render Channels List
    if (this.channelsList) {
      this.channelsList.innerHTML = '';
      rooms.forEach((room) => {
        const item = document.createElement('div');
        const isActive = currentRoomId === room.id;
        item.className = `nav-item ${isActive ? 'active' : ''}`;

        item.innerHTML = `
          <div class="nav-item-left">
            <span class="nav-item-icon">💬</span>
            <span class="nav-item-name">${room.name}</span>
          </div>
        `;

        item.addEventListener('click', () => {
          this.events.emit('select_room', room.id);
        });

        this.channelsList.appendChild(item);
      });
    }

    // 3. Render Team Presence List
    if (this.teamList) {
      this.teamList.innerHTML = '';
      users.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'presence-item';

        item.innerHTML = `
          <div class="presence-avatar-wrap">
            <div class="presence-avatar" style="background-color: ${user.color}">
              ${(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span class="presence-dot status-${user.status || 'active'}"></span>
          </div>
          <div class="presence-info">
            <div class="presence-name">${user.name}</div>
            <div class="presence-focus">${user.currentFocus || 'Viewing workspace'}</div>
          </div>
        `;

        this.teamList.appendChild(item);
      });
    }

    // 4. Update online counter
    if (this.onlineCountBadge) {
      this.onlineCountBadge.textContent = `${users.length} Online`;
    }
  }
}
