/**
 * @file ChatView.js
 * @description View controller for team chat channels, message stream, emoji reactions, and typing indicator
 */

import { QUICK_EMOJIS } from '../../config/constants.js';

export class ChatView {
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
    this.typingTimer = null;
    this.isTyping = false;

    this._bindElements();
    this._attachListeners();
    this.render();
  }

  _bindElements() {
    this.channelName = document.getElementById('chat-active-channel-name');
    this.channelTopic = document.getElementById('chat-active-channel-topic');
    this.messagesList = document.getElementById('chat-messages-stream');
    this.typingContainer = document.getElementById('chat-typing-container');
    this.typingText = document.getElementById('chat-typing-text');
    this.chatInput = document.getElementById('chat-composer-input');
    this.btnSend = document.getElementById('btn-chat-send');

    this.btnToolBold = document.getElementById('btn-tool-bold');
    this.btnToolCode = document.getElementById('btn-tool-code');
  }

  _attachListeners() {
    // Send message on click
    if (this.btnSend) {
      this.btnSend.addEventListener('click', () => this.sendMessage());
    }

    // Input handlers
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      this.chatInput.addEventListener('input', () => {
        this._handleTyping();
      });
    }

    // Quick markdown format buttons
    if (this.btnToolBold && this.chatInput) {
      this.btnToolBold.addEventListener('click', () => {
        this._wrapSelection('**', '**');
      });
    }

    if (this.btnToolCode && this.chatInput) {
      this.btnToolCode.addEventListener('click', () => {
        this._wrapSelection('`', '`');
      });
    }

    // Store subscription
    this.store.subscribe(({ actionTag }) => {
      if (actionTag === 'NEW_MESSAGE_RECEIVED') {
        this.renderMessages(true);
      } else if (actionTag === 'ROOM_CHANGED') {
        this.renderChannelHeader();
        this.renderMessages(true);
      } else if (actionTag === 'TYPING_UPDATED') {
        this.renderTypingIndicator();
      } else if (actionTag === 'REACTIONS_UPDATED') {
        this.renderMessages(false);
      }
    });
  }

  _wrapSelection(before, after) {
    const input = this.chatInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.substring(start, end) || 'text';

    input.value = input.value.substring(0, start) + before + selected + after + input.value.substring(end);
    input.focus();
    input.selectionStart = start + before.length;
    input.selectionEnd = start + before.length + selected.length;
  }

  _handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.events.emit('local_typing_status', true);
    }

    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
      this.events.emit('local_typing_status', false);
    }, 2000);
  }

  sendMessage() {
    if (!this.chatInput) return;
    const text = this.chatInput.value.trim();
    if (!text) return;

    const { currentRoomId } = this.store.getState();
    this.events.emit('local_send_message', {
      roomId: currentRoomId,
      text,
    });

    this.chatInput.value = '';
    this.isTyping = false;
    this.events.emit('local_typing_status', false);
  }

  renderChannelHeader() {
    const { rooms, currentRoomId } = this.store.getState();
    const activeRoom = rooms.find((r) => r.id === currentRoomId);
    if (!activeRoom) return;

    if (this.channelName) this.channelName.textContent = activeRoom.name;
    if (this.channelTopic) this.channelTopic.textContent = activeRoom.topic || 'Channel discussion';
  }

  renderTypingIndicator() {
    const { typingUsers } = this.store.getState();
    if (!this.typingContainer || !this.typingText) return;

    if (typingUsers && typingUsers.length > 0) {
      const names = typingUsers.join(', ');
      this.typingText.textContent = `${names} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;
      this.typingContainer.style.visibility = 'visible';
    } else {
      this.typingContainer.style.visibility = 'hidden';
    }
  }

  renderMessages(autoScroll = false) {
    if (!this.messagesList) return;
    const { messages, currentUser } = this.store.getState();

    this.messagesList.innerHTML = '';

    messages.forEach((msg) => {
      const msgEl = document.createElement('div');
      msgEl.className = 'chat-message';
      msgEl.dataset.messageId = msg.id;

      const dateStr = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Render reactions pills
      let reactionsHtml = '';
      if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        reactionsHtml += '<div class="message-reactions">';
        for (const [emoji, usersList] of Object.entries(msg.reactions)) {
          if (usersList.length > 0) {
            const hasReacted = currentUser && usersList.includes(currentUser.id);
            reactionsHtml += `
              <button class="reaction-pill ${hasReacted ? 'reacted' : ''}" data-emoji="${emoji}" title="${usersList.length} reaction(s)">
                <span>${emoji}</span>
                <span class="reaction-count">${usersList.length}</span>
              </button>
            `;
          }
        }
        reactionsHtml += '</div>';
      }

      // Quick emoji hover bar
      let hoverBarHtml = '<div class="message-hover-actions">';
      QUICK_EMOJIS.slice(0, 5).forEach((emoji) => {
        hoverBarHtml += `<button class="btn-emoji-quick" data-emoji="${emoji}">${emoji}</button>`;
      });
      hoverBarHtml += '</div>';

      // Parse inline message markdown
      const formattedText = this._formatMessageText(msg.text);

      msgEl.innerHTML = `
        <div class="message-avatar" style="background-color: ${msg.user.color || '#6366f1'}">
          ${(msg.user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div class="message-body">
          <div class="message-meta">
            <span class="message-author" style="color: ${msg.user.color || '#c7d2fe'}">${msg.user.name}</span>
            <span class="message-time">${dateStr}</span>
          </div>
          <div class="message-text">${formattedText}</div>
          ${reactionsHtml}
        </div>
        ${hoverBarHtml}
      `;

      // Wire emoji reaction clicks
      msgEl.querySelectorAll('.btn-emoji-quick, .reaction-pill').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const emoji = btn.dataset.emoji;
          const { currentRoomId } = this.store.getState();
          this.events.emit('local_reaction_toggle', {
            roomId: currentRoomId,
            messageId: msg.id,
            emoji,
          });
        });
      });

      this.messagesList.appendChild(msgEl);
    });

    if (autoScroll) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  }

  _formatMessageText(text) {
    if (!text) return '';
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  render() {
    this.renderChannelHeader();
    this.renderMessages(true);
    this.renderTypingIndicator();
  }
}
