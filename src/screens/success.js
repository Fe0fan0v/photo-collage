/**
 * Success/Result Screen
 * Shows the final collage with action buttons
 */

import { createElement } from '../utils/helpers.js';
import logoUrl from '../assets/logo.png';

export class SuccessScreen {
  constructor(app) {
    this.app = app;
    this.showingConfirmation = false;
  }

  render(params = {}) {
    const screen = createElement('div', { className: 'screen screen-success' });

    // Logo header (gray background)
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    // Content
    const content = createElement('div', { className: 'success-content' });

    // Second logo placeholder (Russian Hybrid - will be added later)
    const secondLogo = createElement('div', { className: 'success-second-logo' });
    secondLogo.innerHTML = '<div style="padding: 20px; text-align: center; font-size: 0.9rem; color: rgba(255,255,255,0.5);">SELETTI RUSSIAN HYBRID<br>(логотип будет позже)</div>';
    content.appendChild(secondLogo);

    // Collage preview
    const collageDataUrl = this.app.getCollage();

    if (collageDataUrl) {
      const preview = createElement('div', { className: 'collage-preview' });
      const img = createElement('img', {
        src: collageDataUrl,
        alt: 'Ваш гибрид'
      });
      preview.appendChild(img);
      content.appendChild(preview);
    }

    // Website link
    const websiteLink = createElement('a', {
      className: 'success-website-link',
      href: 'https://seletti.ru',
      target: '_blank',
      rel: 'noopener noreferrer'
    });
    websiteLink.textContent = 'seletti.ru';
    content.appendChild(websiteLink);

    // Confirmation message (hidden by default, shown after email sent)
    this.confirmationMessage = createElement('div', { className: 'success-confirmation hidden' });
    this.confirmationMessage.textContent = 'Готово!';
    content.appendChild(this.confirmationMessage);

    // Action buttons
    const actions = createElement('div', { className: 'success-actions' });

    // Send to email button
    const emailButton = createElement('button', {
      className: 'btn btn-primary btn-success-main',
      onClick: () => this.handleSendEmail()
    });
    emailButton.textContent = 'ОТПРАВИТЬ НА ПОЧТУ\nВ ХОРОШЕМ КАЧЕСТВЕ';
    actions.appendChild(emailButton);

    // Print at stand button
    const printButton = createElement('button', {
      className: 'btn btn-primary btn-success-main',
      onClick: () => this.handlePrint()
    });
    printButton.textContent = 'РАСПЕЧАТАТЬ\nУ МЕНЕДЖЕРА СТЕНДА';
    actions.appendChild(printButton);

    // Start over button (small)
    const restartButton = createElement('button', {
      className: 'btn btn-restart',
      onClick: () => this.handleRestart()
    });
    restartButton.textContent = 'НАЧАТЬ СНАЧАЛА';
    actions.appendChild(restartButton);

    content.appendChild(actions);

    // Footer note
    const footerNote = createElement('div', { className: 'success-footer-note' });
    footerNote.innerHTML = 'Возможно<br>контроли<br>"распечатать"<br>не будет';
    content.appendChild(footerNote);

    screen.appendChild(content);

    return screen;
  }

  handleSendEmail() {
    // Navigate to email form
    this.app.navigateTo('emailForm');
  }

  handlePrint() {
    // Also navigate to email form (both buttons lead to same screen)
    this.app.navigateTo('emailForm');
  }

  handleRestart() {
    this.app.reset();
    this.app.navigateTo('camera');
  }

  mount(params = {}) {
    // Show confirmation if returning from email form
    if (params.showConfirmation) {
      this.showConfirmation();
    }
  }

  showConfirmation() {
    // Show "Готово!" message for 2-3 seconds
    this.showingConfirmation = true;
    if (this.confirmationMessage) {
      this.confirmationMessage.classList.remove('hidden');

      setTimeout(() => {
        this.confirmationMessage.classList.add('hidden');
        this.showingConfirmation = false;
      }, 2500);
    }
  }

  cleanup() {
    this.showingConfirmation = false;
  }
}
