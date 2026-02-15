/**
 * Final Screen
 * Shows collage with Telegram promo and action buttons
 * After email sent: shows "Готово!" popup that auto-closes, then this screen
 */

import { createElement } from '../utils/helpers.js';
import { sendCollageToMultiple } from '../services/emailjs.js';
import logoUrl from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export class FinalScreen {
  constructor(app) {
    this.app = app;
    this.isSending = false;
  }

  render() {
    const screen = createElement('div', { className: 'screen screen-final' });

    // Logo header (gray background)
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    // Scrollable content
    const scrollContent = createElement('div', { className: 'final-scroll-content' });

    // Collage preview
    const collageDataUrl = this.app.getCollage();

    if (collageDataUrl) {
      const preview = createElement('div', { className: 'final-collage-preview' });
      const img = createElement('img', {
        src: collageDataUrl,
        alt: 'Ваш гибрид'
      });
      preview.appendChild(img);
      scrollContent.appendChild(preview);
    }

    // Telegram section (between collage and buttons, like reference)
    const telegramSection = createElement('a', {
      className: 'final-telegram-section',
      href: 'https://t.me/selettistoremoscow/607',
      target: '_blank',
      rel: 'noopener noreferrer'
    });
    const tgText = createElement('p', { className: 'final-tg-text' });
    tgText.textContent = 'Выиграть тарелку из новой коллекции в Telegram';
    telegramSection.appendChild(tgText);
    const tgIcon = createElement('div', { className: 'final-tg-icon' });
    tgIcon.innerHTML = `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tg-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2AABEE"/><stop offset="100%" stop-color="#229ED9"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#tg-g)"/><path fill="#fff" d="M98 175c-3.9 0-3.2-1.5-4.6-5.2L82 132.2 168.6 80l4 2.3-3.4 3.3"/><path fill="#fff" d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12"/><path fill="#fff" d="M100 144.6l48.4 35.7c5.5 3 9.5 1.5 10.9-5.1l19.7-92.8c2-8.1-3.1-11.7-8.4-9.3L55 117.5c-7.9 3.2-7.8 7.6-1.4 9.5l38.7 12.1 89.4-56.3c4.2-2.6 8.1-1.2 4.9 1.6"/></svg>`;
    telegramSection.appendChild(tgIcon);
    const tgLabel = createElement('span', { className: 'final-tg-label' });
    tgLabel.textContent = 'Хочу тарелку!';
    telegramSection.appendChild(tgLabel);
    scrollContent.appendChild(telegramSection);

    // Action buttons
    const actions = createElement('div', { className: 'final-actions' });

    const emailButton = createElement('button', {
      className: 'btn btn-primary btn-final-action',
      onClick: () => this.handleSendEmail()
    });
    emailButton.textContent = 'ОТПРАВИТЬ НА ПОЧТУ\nВ ХОРОШЕМ КАЧЕСТВЕ';
    actions.appendChild(emailButton);

    const printButton = createElement('button', {
      className: 'btn btn-primary btn-final-action',
      onClick: () => this.handlePrint()
    });
    printButton.textContent = 'РАСПЕЧАТАТЬ\nУ МЕНЕДЖЕРА СТЕНДА';
    actions.appendChild(printButton);

    // Start over button (together with other buttons)
    const restartBtn = createElement('button', {
      className: 'btn btn-primary btn-restart-small',
      onClick: () => {
        this.app.reset();
        this.app.navigateTo('camera');
      }
    });
    restartBtn.textContent = 'НАЧАТЬ СНАЧАЛА';
    actions.appendChild(restartBtn);

    scrollContent.appendChild(actions);

    // Website link (below all buttons)
    const websiteLink = createElement('a', {
      className: 'final-website-link',
      href: 'https://www.seletti.ru',
      target: '_blank',
      rel: 'noopener noreferrer'
    });
    websiteLink.textContent = 'www.seletti.ru';
    scrollContent.appendChild(websiteLink);

    screen.appendChild(scrollContent);

    return screen;
  }

  async handleSendEmail() {
    await this.sendToEmails();
  }

  async handlePrint() {
    await this.sendToEmails();
  }

  _fetchWithTimeout(url, options, timeoutMs = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  async sendToEmails() {
    if (this.isSending) return;

    const emails = this.app.getEmails();

    // If no emails saved, go to email form
    if (!emails || emails.length === 0) {
      this.app.navigateTo('emailForm');
      return;
    }

    // Send to saved emails
    this.isSending = true;

    // Disable buttons and show loading state
    const buttons = document.querySelectorAll('.btn-final-action');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.textContent = 'Отправляем...';
    });

    try {
      const collageDataUrl = this.app.getCollage();
      const primaryEmail = emails[0];

      // Run save-collage and send-email in parallel
      const savePromise = this._fetchWithTimeout(`${API_URL}/save-collage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: collageDataUrl,
          email: primaryEmail.email,
          customerType: primaryEmail.customerType
        })
      }, 90000).then(async (res) => {
        if (res.ok) {
          const result = await res.json();
          if (result.success) return result;
        }
        return null;
      }).catch((err) => {
        console.error('Failed to save collage:', err);
        return null;
      });

      const recipients = emails.map(({ email, customerType }) => ({ email, customerType }));
      const emailPromise = sendCollageToMultiple(recipients, collageDataUrl);

      await Promise.all([savePromise, emailPromise]);

      // Show success message
      this.showSuccessMessage();
    } catch (error) {
      console.error('Send error:', error);
      const msg = error.name === 'AbortError'
        ? 'Превышено время ожидания. Проверьте интернет и попробуйте ещё раз.'
        : (error.message || 'Произошла ошибка. Попробуйте еще раз.');
      alert(msg);
    } finally {
      this.isSending = false;

      // Re-enable buttons
      buttons.forEach((btn, index) => {
        btn.disabled = false;
        if (index === 0) {
          btn.textContent = 'ОТПРАВИТЬ НА ПОЧТУ\nВ ХОРОШЕМ КАЧЕСТВЕ';
        } else {
          btn.textContent = 'РАСПЕЧАТАТЬ\nУ МЕНЕДЖЕРА СТЕНДА';
        }
      });
    }
  }

  showSuccessMessage() {
    // Create temporary success message
    const message = createElement('div', { className: 'final-success-message' });
    message.textContent = 'Отправлено!';

    const scrollContent = document.querySelector('.final-scroll-content');
    if (scrollContent) {
      scrollContent.appendChild(message);

      setTimeout(() => {
        message.classList.add('visible');
      }, 10);

      setTimeout(() => {
        message.classList.remove('visible');
        setTimeout(() => {
          message.remove();
        }, 300);
      }, 2500);
    }
  }

  mount(params = {}) {
    if (params.showTelegramPopup) {
      this.showGotovoPopup();
    }
  }

  showGotovoPopup() {
    // Remove existing popup if any
    const existing = document.querySelector('.tg-popup-overlay');
    if (existing) existing.remove();

    // Simple overlay with "Готово!" + Telegram promo
    const overlay = createElement('div', { className: 'tg-popup-overlay' });

    // Close button (yellow circle)
    const closeBtn = createElement('button', {
      className: 'tg-popup-close',
      onClick: () => this.closePopup(overlay)
    });
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);

    // "Готово!" title
    const title = createElement('h2', { className: 'tg-popup-title' });
    title.textContent = 'Готово!';
    overlay.appendChild(title);

    // Promo text
    const text = createElement('p', { className: 'tg-popup-text' });
    text.textContent = 'Выиграть тарелку из новой коллекции в Telegram';
    overlay.appendChild(text);

    // Telegram icon + link
    const tgLink = createElement('a', {
      className: 'tg-popup-tg-link',
      href: 'https://t.me/selettistoremoscow/607',
      target: '_blank',
      rel: 'noopener noreferrer'
    });
    const tgIcon = createElement('div', { className: 'tg-popup-tg-icon' });
    tgIcon.innerHTML = `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tg-p" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2AABEE"/><stop offset="100%" stop-color="#229ED9"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#tg-p)"/><path fill="#fff" d="M98 175c-3.9 0-3.2-1.5-4.6-5.2L82 132.2 168.6 80l4 2.3-3.4 3.3"/><path fill="#fff" d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12"/><path fill="#fff" d="M100 144.6l48.4 35.7c5.5 3 9.5 1.5 10.9-5.1l19.7-92.8c2-8.1-3.1-11.7-8.4-9.3L55 117.5c-7.9 3.2-7.8 7.6-1.4 9.5l38.7 12.1 89.4-56.3c4.2-2.6 8.1-1.2 4.9 1.6"/></svg>`;
    tgLink.appendChild(tgIcon);
    const tgLabel = createElement('span', { className: 'tg-popup-tg-label' });
    tgLabel.textContent = 'Хочу тарелку!';
    tgLink.appendChild(tgLabel);
    overlay.appendChild(tgLink);

    document.querySelector('.screen-final').appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // No auto-close — only manual close via yellow × button
  }

  closePopup(overlay) {
    if (this._popupTimer) {
      clearTimeout(this._popupTimer);
      this._popupTimer = null;
    }
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }

  cleanup() {
    this.isSending = false;
    if (this._popupTimer) {
      clearTimeout(this._popupTimer);
      this._popupTimer = null;
    }
  }
}
