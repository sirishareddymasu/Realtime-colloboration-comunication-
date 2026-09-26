/**
 * @file ModalView.js
 * @description View controller managing modals for version checkpoints, new items, and user profile
 */

import { USER_COLORS, USER_STATUSES } from '../../config/constants.js';

export class ModalView {
  /**
   * @param {Object} options
   * @param {import('../../core/Store.js').Store} options.store
   * @param {import('../../core/EventEmitter.js').EventEmitter} options.events
   * @param {import('../../services/StorageService.js').StorageService} options.storage
   */
  constructor({ store, events, storage }) {
    this.store = store;
    this.events = events;
    this.storage = storage;

    this.overlay = document.getElementById('modal-overlay');
    this.modalContainer = document.getElementById('modal-container');

    this._attachListeners();
  }

  _attachListeners() {
    this.events.on('open_modal', ({ type, payload }) => {
      this.openModal(type, payload);
    });

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.closeModal();
        }
      });
    }
  }

  closeModal() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.modalContainer.innerHTML = '';
    }
  }

  /**
   * Opens requested modal
   * @param {'history'|'checkpoint'|'new_doc'|'new_channel'|'profile'} type
   * @param {*} [payload]
   */
  openModal(type, payload) {
    if (!this.overlay || !this.modalContainer) return;

    this.modalContainer.innerHTML = '';

    switch (type) {
      case 'history':
        this._renderHistoryModal();
        break;
      case 'checkpoint':
        this._renderCheckpointModal();
        break;
      case 'new_doc':
        this._renderNewDocModal();
        break;
      case 'new_channel':
        this._renderNewChannelModal();
        break;
      case 'profile':
        this._renderProfileModal();
        break;
      default:
        return;
    }

    this.overlay.classList.add('active');
  }

  /**
   * Render Version History / Checkpoint Modal
   * @private
   */
  _renderHistoryModal() {
    const { currentDoc } = this.store.getState();
    const checkpoints = currentDoc ? currentDoc.checkpoints || [] : [];

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog wide';

    let listHtml = '';
    if (checkpoints.length === 0) {
      listHtml = '<p style="color:var(--text-muted);text-align:center;">No checkpoints recorded yet.</p>';
    } else {
      listHtml = '<div class="checkpoint-timeline">';
      checkpoints.forEach((cp) => {
        const timeStr = new Date(cp.timestamp).toLocaleString();
        const authorName = cp.author ? cp.author.name : 'System';

        listHtml += `
          <div class="checkpoint-card">
            <div class="checkpoint-meta">
              <span class="checkpoint-title">${cp.title}</span>
              <div class="checkpoint-subtitle">
                <span>🔖 v${cp.version}</span>
                <span>👤 ${authorName}</span>
                <span>⏱️ ${timeStr}</span>
              </div>
            </div>
            <button class="btn-restore-cp" data-id="${cp.id}">Restore Version</button>
          </div>
        `;
      });
      listHtml += '</div>';
    }

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">🕰️ Document Version History</h3>
        <button class="btn-modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
          View historical checkpoints of <strong>${currentDoc ? currentDoc.title : 'this document'}</strong>. Restoring a version will synchronize all active collaborators.
        </p>
        ${listHtml}
      </div>
      <div class="modal-footer">
        <button class="btn-toolbar-action" id="btn-close-history">Close</button>
      </div>
    `;

    dialog.querySelector('.btn-modal-close').addEventListener('click', () => this.closeModal());
    dialog.querySelector('#btn-close-history').addEventListener('click', () => this.closeModal());

    dialog.querySelectorAll('.btn-restore-cp').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cpId = btn.dataset.id;
        this.events.emit('local_revert_checkpoint', {
          docId: currentDoc.id,
          checkpointId: cpId,
        });
        this.closeModal();
      });
    });

    this.modalContainer.appendChild(dialog);
  }

  /**
   * Render Create Checkpoint Modal
   * @private
   */
  _renderCheckpointModal() {
    const { currentDoc } = this.store.getState();
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">🔖 Create Document Checkpoint</h3>
        <button class="btn-modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Checkpoint Title / Label</label>
          <input type="text" id="input-checkpoint-title" class="form-input" placeholder="e.g. Major refactor before release v1.2" autofocus />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-toolbar-action" id="btn-cancel-cp">Cancel</button>
        <button class="btn-toolbar-action primary" id="btn-confirm-cp">Save Checkpoint</button>
      </div>
    `;

    dialog.querySelector('.btn-modal-close').addEventListener('click', () => this.closeModal());
    dialog.querySelector('#btn-cancel-cp').addEventListener('click', () => this.closeModal());

    dialog.querySelector('#btn-confirm-cp').addEventListener('click', () => {
      const input = dialog.querySelector('#input-checkpoint-title');
      const title = input.value.trim() || `Milestone v${currentDoc.version}`;
      this.events.emit('local_create_checkpoint', {
        docId: currentDoc.id,
        title,
      });
      this.closeModal();
    });

    this.modalContainer.appendChild(dialog);
  }

  /**
   * Render New Document Modal
   * @private
   */
  _renderNewDocModal() {
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">📄 New Collaborative Document</h3>
        <button class="btn-modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Document Title</label>
          <input type="text" id="input-newdoc-title" class="form-input" placeholder="e.g. Sprint Backlog & Planning" autofocus />
        </div>
        <div class="form-group">
          <label class="form-label">Format / Syntax</label>
          <select id="select-newdoc-lang" class="form-select">
            <option value="markdown">Markdown (.md)</option>
            <option value="javascript">JavaScript (.js)</option>
            <option value="html">HTML5 (.html)</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-toolbar-action" id="btn-cancel-newdoc">Cancel</button>
        <button class="btn-toolbar-action primary" id="btn-confirm-newdoc">Create Document</button>
      </div>
    `;

    dialog.querySelector('.btn-modal-close').addEventListener('click', () => this.closeModal());
    dialog.querySelector('#btn-cancel-newdoc').addEventListener('click', () => this.closeModal());

    dialog.querySelector('#btn-confirm-newdoc').addEventListener('click', () => {
      const title = dialog.querySelector('#input-newdoc-title').value.trim();
      const language = dialog.querySelector('#select-newdoc-lang').value;
      if (!title) return;

      this.events.emit('local_create_doc', {
        title,
        language,
        initialContent: `# ${title}\n\nStart collaborating here in real-time...\n`,
      });
      this.closeModal();
    });

    this.modalContainer.appendChild(dialog);
  }

  /**
   * Render New Channel Modal
   * @private
   */
  _renderNewChannelModal() {
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">💬 Create Discussion Channel</h3>
        <button class="btn-modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Channel Name</label>
          <input type="text" id="input-channel-name" class="form-input" placeholder="e.g. product-roadmap" autofocus />
        </div>
        <div class="form-group">
          <label class="form-label">Topic / Purpose</label>
          <input type="text" id="input-channel-topic" class="form-input" placeholder="e.g. Planning Q4 features & deliverables" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-toolbar-action" id="btn-cancel-newchan">Cancel</button>
        <button class="btn-toolbar-action primary" id="btn-confirm-newchan">Create Channel</button>
      </div>
    `;

    dialog.querySelector('.btn-modal-close').addEventListener('click', () => this.closeModal());
    dialog.querySelector('#btn-cancel-newchan').addEventListener('click', () => this.closeModal());

    dialog.querySelector('#btn-confirm-newchan').addEventListener('click', () => {
      const name = dialog.querySelector('#input-channel-name').value.trim();
      const topic = dialog.querySelector('#input-channel-topic').value.trim();
      if (!name) return;

      this.events.emit('local_create_room', { name, topic });
      this.closeModal();
    });

    this.modalContainer.appendChild(dialog);
  }

  /**
   * Render User Persona / Profile Settings Modal
   * @private
   */
  _renderProfileModal() {
    const { currentUser } = this.store.getState();
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    let colorSwatchesHtml = '<div class="color-swatches">';
    USER_COLORS.forEach((color) => {
      const isSelected = currentUser && currentUser.color === color;
      colorSwatchesHtml += `
        <button class="swatch-btn ${isSelected ? 'selected' : ''}" style="background-color: ${color}" data-color="${color}"></button>
      `;
    });
    colorSwatchesHtml += '</div>';

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">👤 Collaborator Profile & Status</h3>
        <button class="btn-modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Your Name</label>
          <input type="text" id="input-profile-name" class="form-input" value="${currentUser ? currentUser.name : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="select-profile-status" class="form-select">
            <option value="active" ${currentUser && currentUser.status === 'active' ? 'selected' : ''}>🟢 Active</option>
            <option value="in-meeting" ${currentUser && currentUser.status === 'in-meeting' ? 'selected' : ''}>🟣 In Meeting</option>
            <option value="busy" ${currentUser && currentUser.status === 'busy' ? 'selected' : ''}>🔴 Busy / Do Not Disturb</option>
            <option value="away" ${currentUser && currentUser.status === 'away' ? 'selected' : ''}>🟡 Away</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Avatar & Cursor Radar Color</label>
          ${colorSwatchesHtml}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-toolbar-action" id="btn-cancel-profile">Cancel</button>
        <button class="btn-toolbar-action primary" id="btn-save-profile">Save Changes</button>
      </div>
    `;

    dialog.querySelector('.btn-modal-close').addEventListener('click', () => this.closeModal());
    dialog.querySelector('#btn-cancel-profile').addEventListener('click', () => this.closeModal());

    let selectedColor = currentUser ? currentUser.color : USER_COLORS[0];
    dialog.querySelectorAll('.swatch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        dialog.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedColor = btn.dataset.color;
      });
    });

    dialog.querySelector('#btn-save-profile').addEventListener('click', () => {
      const name = dialog.querySelector('#input-profile-name').value.trim();
      const status = dialog.querySelector('#select-profile-status').value;
      if (!name) return;

      const updatedProfile = {
        ...currentUser,
        name,
        color: selectedColor,
        status,
      };

      this.events.emit('local_update_profile', updatedProfile);
      this.closeModal();
    });

    this.modalContainer.appendChild(dialog);
  }
}
