/**
 * @file EditorView.js
 * @description Collaborative text/code editor with line numbering, split markdown preview, and cursor sync
 */

export class EditorView {
  /**
   * @param {Object} options
   * @param {import('../../core/Store.js').Store} options.store
   * @param {import('../../core/EventEmitter.js').EventEmitter} options.events
   */
  constructor({ store, events }) {
    this.store = store;
    this.events = events;
    this.typingDebounceTimer = null;
    this.cursorDebounceTimer = null;
    this.isLocalTyping = false;

    this._bindElements();
    this._attachListeners();
    this.render();
  }

  _bindElements() {
    this.titleInput = document.getElementById('editor-doc-title');
    this.versionPill = document.getElementById('editor-version-pill');
    this.btnEditMode = document.getElementById('btn-mode-edit');
    this.btnSplitMode = document.getElementById('btn-mode-split');
    this.btnPreviewMode = document.getElementById('btn-mode-preview');

    this.btnCheckpoint = document.getElementById('btn-create-checkpoint');
    this.btnHistory = document.getElementById('btn-view-history');
    this.btnExport = document.getElementById('btn-export-doc');

    this.editorPane = document.getElementById('editor-pane');
    this.previewPane = document.getElementById('preview-pane');
    this.lineNumbers = document.getElementById('editor-line-numbers');
    this.textarea = document.getElementById('editor-textarea');

    // Status bar
    this.statPos = document.getElementById('status-cursor-pos');
    this.statCounts = document.getElementById('status-counts');
    this.statVersion = document.getElementById('status-doc-version');
    this.statAuthor = document.getElementById('status-doc-author');
  }

  _attachListeners() {
    // Mode toggles
    if (this.btnEditMode) {
      this.btnEditMode.addEventListener('click', () => this.setMode('edit'));
    }
    if (this.btnSplitMode) {
      this.btnSplitMode.addEventListener('click', () => this.setMode('split'));
    }
    if (this.btnPreviewMode) {
      this.btnPreviewMode.addEventListener('click', () => this.setMode('preview'));
    }

    // Checkpoint & History buttons
    if (this.btnCheckpoint) {
      this.btnCheckpoint.addEventListener('click', () => {
        this.events.emit('open_modal', { type: 'checkpoint' });
      });
    }

    if (this.btnHistory) {
      this.btnHistory.addEventListener('click', () => {
        this.events.emit('open_modal', { type: 'history' });
      });
    }

    if (this.btnExport) {
      this.btnExport.addEventListener('click', () => {
        this.exportDocument();
      });
    }

    // Textarea input & cursor change
    if (this.textarea) {
      this.textarea.addEventListener('input', () => this._handleInput());
      this.textarea.addEventListener('keydown', (e) => this._handleKeydown(e));
      this.textarea.addEventListener('keyup', () => this._handleCursorActivity());
      this.textarea.addEventListener('click', () => this._handleCursorActivity());
      this.textarea.addEventListener('scroll', () => {
        if (this.lineNumbers) {
          this.lineNumbers.scrollTop = this.textarea.scrollTop;
        }
      });
    }

    // Subscribe to state changes
    this.store.subscribe(({ actionTag }) => {
      if (actionTag === 'DOC_LOADED') {
        this.loadCurrentDoc();
      } else if (actionTag === 'REMOTE_DOC_SYNC') {
        this.applyRemoteUpdate();
      } else {
        this.renderMeta();
      }
    });
  }

  /**
   * Set editor layout mode
   * @param {'edit'|'split'|'preview'} mode
   */
  setMode(mode) {
    this.store.setState({ editorViewMode: mode });

    if (this.btnEditMode) this.btnEditMode.classList.toggle('active', mode === 'edit');
    if (this.btnSplitMode) this.btnSplitMode.classList.toggle('active', mode === 'split');
    if (this.btnPreviewMode) this.btnPreviewMode.classList.toggle('active', mode === 'preview');

    if (mode === 'edit') {
      if (this.editorPane) this.editorPane.style.display = 'flex';
      if (this.previewPane) this.previewPane.classList.add('hidden');
    } else if (mode === 'preview') {
      if (this.editorPane) this.editorPane.style.display = 'none';
      if (this.previewPane) {
        this.previewPane.classList.remove('hidden');
        this.renderPreview();
      }
    } else {
      // Split
      if (this.editorPane) this.editorPane.style.display = 'flex';
      if (this.previewPane) {
        this.previewPane.classList.remove('hidden');
        this.renderPreview();
      }
    }
  }

  /**
   * Handle user typing in textarea
   * @private
   */
  _handleInput() {
    this.isLocalTyping = true;
    this.updateLineNumbers();
    this.renderPreview();
    this.updateStats();

    this.store.setState({ syncStatus: 'syncing' });

    clearTimeout(this.typingDebounceTimer);
    this.typingDebounceTimer = setTimeout(() => {
      const { currentDoc } = this.store.getState();
      if (!currentDoc) return;

      const content = this.textarea.value;
      this.events.emit('local_doc_change', {
        docId: currentDoc.id,
        content,
        clientVersion: currentDoc.version,
      });

      this.isLocalTyping = false;
    }, 150);
  }

  /**
   * Special key handlers (e.g. Tab indent support)
   * @private
   */
  _handleKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;

      this.textarea.value =
        this.textarea.value.substring(0, start) + '  ' + this.textarea.value.substring(end);

      this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
      this._handleInput();
    }
  }

  /**
   * Broadcast cursor position to collaborators
   * @private
   */
  _handleCursorActivity() {
    this.updateStats();

    clearTimeout(this.cursorDebounceTimer);
    this.cursorDebounceTimer = setTimeout(() => {
      const { currentDoc } = this.store.getState();
      if (!currentDoc || !this.textarea) return;

      const text = this.textarea.value;
      const selStart = this.textarea.selectionStart;
      const selEnd = this.textarea.selectionEnd;

      // Calculate line and column
      const lines = text.substring(0, selStart).split('\n');
      const line = lines.length;
      const ch = lines[lines.length - 1].length;

      this.events.emit('local_cursor_move', {
        docId: currentDoc.id,
        line,
        ch,
        selection: selStart !== selEnd ? { start: selStart, end: selEnd } : null,
      });
    }, 80);
  }

  /**
   * Populate content when a document is first opened
   */
  loadCurrentDoc() {
    const { currentDoc } = this.store.getState();
    if (!currentDoc || !this.textarea) return;

    this.textarea.value = currentDoc.content || '';
    this.updateLineNumbers();
    this.renderPreview();
    this.renderMeta();
    this.updateStats();
  }

  /**
   * Apply remote update from another collaborator without disrupting local caret
   */
  applyRemoteUpdate() {
    const { currentDoc } = this.store.getState();
    if (!currentDoc || !this.textarea) return;

    // Preserve selection
    const prevStart = this.textarea.selectionStart;
    const prevEnd = this.textarea.selectionEnd;

    if (this.textarea.value !== currentDoc.content) {
      this.textarea.value = currentDoc.content;

      // Restore selection
      this.textarea.selectionStart = Math.min(prevStart, this.textarea.value.length);
      this.textarea.selectionEnd = Math.min(prevEnd, this.textarea.value.length);

      this.updateLineNumbers();
      this.renderPreview();
      this.renderMeta();
      this.updateStats();
    }
  }

  updateLineNumbers() {
    if (!this.lineNumbers || !this.textarea) return;
    const lineCount = (this.textarea.value.match(/\n/g) || []).length + 1;
    let numbersHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      numbersHtml += `${i}<br>`;
    }
    this.lineNumbers.innerHTML = numbersHtml;
  }

  /**
   * Lightweight markdown to HTML renderer
   */
  renderPreview() {
    if (!this.previewPane || !this.textarea) return;
    const raw = this.textarea.value;
    this.previewPane.innerHTML = this.parseMarkdown(raw);
  }

  /**
   * Robust client-side markdown converter
   * @param {string} md
   * @returns {string}
   */
  parseMarkdown(md) {
    if (!md) return '<p style="color:var(--text-muted);font-style:italic;">Empty document...</p>';

    let html = md
      // Escape script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Code blocks ```code```
      .replace(/```([a-z0-9]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const safe = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre><code class="language-${lang}">${safe}</code></pre>`;
      })
      // Inline code
      .replace(/`([^`]+)`/g, (match, code) => {
        return `<code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
      })
      // Headings
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Blockquotes
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gim, '<hr>')
      // Bold & Italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Unordered lists
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n+/g, '</p><p>');

    return `<p>${html}</p>`;
  }

  renderMeta() {
    const { currentDoc } = this.store.getState();
    if (!currentDoc) return;

    if (this.titleInput) {
      this.titleInput.value = currentDoc.title || '';
    }
    if (this.versionPill) {
      this.versionPill.textContent = `v${currentDoc.version || 1}`;
    }
    if (this.statVersion) {
      this.statVersion.textContent = `Version ${currentDoc.version || 1}`;
    }
    if (this.statAuthor) {
      const author = currentDoc.lastModifiedBy ? currentDoc.lastModifiedBy.name : 'Collab';
      this.statAuthor.textContent = `Last edit by: ${author}`;
    }
  }

  updateStats() {
    if (!this.textarea) return;
    const text = this.textarea.value;
    const selStart = this.textarea.selectionStart || 0;

    const linesBefore = text.substring(0, selStart).split('\n');
    const line = linesBefore.length;
    const col = linesBefore[linesBefore.length - 1].length + 1;

    const words = (text.trim().match(/\S+/g) || []).length;
    const chars = text.length;

    if (this.statPos) {
      this.statPos.textContent = `Ln ${line}, Col ${col}`;
    }
    if (this.statCounts) {
      this.statCounts.textContent = `${words} words, ${chars} chars`;
    }
  }

  exportDocument() {
    const { currentDoc } = this.store.getState();
    if (!currentDoc) return;

    const blob = new Blob([this.textarea.value], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(currentDoc.title || 'document').replace(/[^a-z0-9_-]/gi, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  render() {
    this.renderMeta();
  }
}
