/**
 * @file Toast.js
 * @description Non-intrusive floating toast notification component
 */

export class Toast {
  /**
   * Shows a toast notification
   * @param {Object} options
   * @param {string} options.message
   * @param {'info'|'success'|'warning'|'error'} [options.type='info']
   * @param {number} [options.duration=3500]
   */
  static show({ message, type = 'info', duration = 3500 }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '🔔'}</span>
      <div class="toast-message">${message}</div>
      <button class="toast-close" title="Dismiss">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  static success(message) {
    Toast.show({ message, type: 'success' });
  }

  static info(message) {
    Toast.show({ message, type: 'info' });
  }

  static warning(message) {
    Toast.show({ message, type: 'warning' });
  }

  static error(message) {
    Toast.show({ message, type: 'error' });
  }
}
