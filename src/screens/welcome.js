/**
 * Welcome Screen
 * Initial screen with camera/gallery choice
 */

import { createElement } from '../utils/helpers.js';
import { preloadModel } from '../services/background-removal.js';
import logoUrl from '../assets/logo.png';

export class WelcomeScreen {
  constructor(app) {
    this.app = app;
    this.warningElement = null;
  }

  render() {
    const screen = createElement('div', { className: 'screen screen-welcome' });

    // Logo header
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    // Title banner
    const titleBanner = createElement('h1', { className: 'welcome-banner' });
    titleBanner.textContent = 'СОЗДАЙТЕ СВОЙ HYBRID';
    screen.appendChild(titleBanner);

    // Content container
    const content = createElement('div', { className: 'welcome-content' });

    // Backend warning (hidden by default)
    this.warningElement = createElement('div', {
      className: 'error-message hidden',
      style: { marginBottom: '16px' }
    });
    content.appendChild(this.warningElement);

    // Main buttons
    const mainButtons = createElement('div', { className: 'welcome-main-buttons' });

    const cameraButton = createElement('button', {
      className: 'btn btn-primary btn-welcome-main',
      onClick: () => this.handleCamera()
    });
    cameraButton.textContent = 'ПОДКЛЮЧИТЬ КАМЕРУ';
    mainButtons.appendChild(cameraButton);

    const galleryButton = createElement('button', {
      className: 'btn btn-primary btn-welcome-main',
      onClick: () => this.handleGallery()
    });
    galleryButton.textContent = 'ИЗ ГАЛЕРЕИ ФОТО';
    mainButtons.appendChild(galleryButton);

    content.appendChild(mainButtons);

    // Skip button
    const skipButton = createElement('button', {
      className: 'btn btn-secondary btn-welcome-skip',
      onClick: () => this.handleSkip()
    });
    skipButton.textContent = 'ПРОПУСТИТЬ';
    content.appendChild(skipButton);

    screen.appendChild(content);

    return screen;
  }

  async mount() {
    // Check API health and show warning if not available
    const apiAvailable = await preloadModel();
    if (!apiAvailable) {
      this.showWarning('⚠️ Backend сервер не отвечает. Убедитесь, что Python backend запущен.');
    }
  }

  showWarning(message) {
    if (this.warningElement) {
      this.warningElement.textContent = message;
      this.warningElement.classList.remove('hidden');
    }
  }

  handleCamera() {
    this.app.navigateTo('camera');
  }

  handleGallery() {
    // TODO: Implement gallery selection
    // For now, just go to camera
    alert('Выбор из галереи пока не реализован');
  }

  handleSkip() {
    // Skip to camera
    this.app.navigateTo('camera');
  }
}
