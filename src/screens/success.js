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
    const logoLink = createElement('a', { href: 'http://seletti.ru', target: '_blank' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    logoLink.appendChild(logo);
    header.appendChild(logoLink);
    screen.appendChild(header);

    // Content
    const content = createElement('div', { className: 'success-content' });

    // Collage preview (logo is already in collage background)
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

    // Start over button (small, but same style)
    const restartButton = createElement('button', {
      className: 'btn btn-primary btn-restart-small',
      onClick: () => this.handleRestart()
    });
    restartButton.textContent = 'НАЧАТЬ СНАЧАЛА';
    actions.appendChild(restartButton);

    content.appendChild(actions);

    // Website link (below all buttons)
    const websiteLink = createElement('a', {
      className: 'success-website-link',
      href: 'https://seletti.ru',
      target: '_blank',
      rel: 'noopener noreferrer'
    });
    websiteLink.textContent = 'seletti.ru';
    content.appendChild(websiteLink);
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
