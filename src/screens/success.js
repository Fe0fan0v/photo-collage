/**
 * Success/Result Screen
 * Shows the final collage with send button
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

    // Logo header
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

    // Success message
    const message = createElement('h2', { className: 'success-message' });
    message.textContent = 'ОТЛИЧНО! ТЕПЕРЬ МЫ ОТПРАВИМ ВАМ ФОТО В ХОРОШЕМ КАЧЕСТВЕ';
    content.appendChild(message);

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
    emailButton.textContent = 'ОТПРАВИТЬ';
    actions.appendChild(emailButton);

    content.appendChild(actions);
    screen.appendChild(content);

    return screen;
  }

  handleSendEmail() {
    // Navigate to email form
    this.app.navigateTo('emailForm');
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
