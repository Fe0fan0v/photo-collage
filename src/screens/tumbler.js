/**
 * Tumbler Screen
 * Admin toggle for print button visibility
 */

import { createElement } from '../utils/helpers.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export class TumblerScreen {
  constructor() {
    this.enabled = true;
    this.loading = true;
    this.toggleEl = null;
    this.statusText = null;
    this.passwordSection = null;
    this.passwordInput = null;
    this.errorText = null;
  }

  async render() {
    const screen = createElement('div', {
      className: 'tumbler-screen',
      style: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'PT Sans Caption', sans-serif",
        background: '#000',
        color: '#fff'
      }
    });

    const title = createElement('div', {
      style: {
        fontSize: '1.2rem',
        fontWeight: '700',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textAlign: 'center'
      }
    });
    title.textContent = 'РАСПЕЧАТАТЬ У МЕНЕДЖЕРА СТЕНДА';
    screen.appendChild(title);

    // Toggle switch container
    const toggleContainer = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }
    });

    this.toggleEl = createElement('div', {
      style: {
        width: '100px',
        height: '52px',
        borderRadius: '26px',
        background: '#555',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease'
      },
      onClick: () => this.onToggleClick()
    });

    const knob = createElement('div', {
      style: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: '4px',
        left: '4px',
        transition: 'left 0.3s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
      }
    });
    this.toggleEl.appendChild(knob);
    this.knob = knob;
    toggleContainer.appendChild(this.toggleEl);
    screen.appendChild(toggleContainer);

    // Status text
    this.statusText = createElement('div', {
      style: {
        fontSize: '1rem',
        marginBottom: '24px',
        color: '#aaa',
        textAlign: 'center'
      }
    });
    this.statusText.textContent = 'Загрузка...';
    screen.appendChild(this.statusText);

    // Password section (hidden by default)
    this.passwordSection = createElement('div', {
      style: {
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: '300px'
      }
    });

    this.passwordInput = createElement('input', {
      type: 'password',
      placeholder: 'Введите пароль',
      className: 'form-input',
      style: {
        textAlign: 'center',
        fontSize: '1.1rem'
      }
    });
    this.passwordSection.appendChild(this.passwordInput);

    const applyBtn = createElement('button', {
      className: 'btn btn-primary',
      style: { width: '100%', minWidth: 'auto' },
      onClick: () => this.applyPassword()
    });
    applyBtn.textContent = 'Применить';
    this.passwordSection.appendChild(applyBtn);

    this.errorText = createElement('div', {
      style: {
        color: '#ff4444',
        fontSize: '0.9rem',
        display: 'none',
        textAlign: 'center'
      }
    });
    this.passwordSection.appendChild(this.errorText);

    screen.appendChild(this.passwordSection);

    return screen;
  }

  async mount() {
    try {
      const res = await fetch(`${API_URL}/print-button-setting`);
      const data = await res.json();
      this.enabled = data.enabled;
    } catch {
      this.enabled = true;
    }
    this.loading = false;
    this.updateUI();
  }

  updateUI() {
    if (this.enabled) {
      this.toggleEl.style.background = '#FFED00';
      this.knob.style.left = '52px';
      this.statusText.textContent = 'Кнопка включена';
      this.statusText.style.color = '#FFED00';
    } else {
      this.toggleEl.style.background = '#555';
      this.knob.style.left = '4px';
      this.statusText.textContent = 'Кнопка выключена';
      this.statusText.style.color = '#aaa';
    }
  }

  onToggleClick() {
    if (this.loading) return;
    // Show password section
    this.pendingEnabled = !this.enabled;
    this.passwordSection.style.display = 'flex';
    this.passwordInput.value = '';
    this.errorText.style.display = 'none';
    this.passwordInput.focus();
  }

  async applyPassword() {
    const password = this.passwordInput.value;
    if (!password) return;

    try {
      const res = await fetch(`${API_URL}/print-button-setting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: this.pendingEnabled, password })
      });
      const data = await res.json();

      if (data.success) {
        this.enabled = data.enabled;
        this.updateUI();
        this.passwordSection.style.display = 'none';
        this.errorText.style.display = 'none';
      } else {
        this.errorText.textContent = data.message || 'Неверный пароль';
        this.errorText.style.display = 'block';
      }
    } catch {
      this.errorText.textContent = 'Ошибка сети';
      this.errorText.style.display = 'block';
    }
  }
}
