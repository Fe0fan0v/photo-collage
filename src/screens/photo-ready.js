/**
 * Photo Ready Screen (Single)
 * Shows first captured photo with continue button
 */

import { createElement } from '../utils/helpers.js';
import logoUrl from '../assets/logo.png';

export class PhotoReadyScreen {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const screen = createElement('div', { className: 'screen screen-photo-ready' });

    // Logo header
    const header = createElement('div', { className: 'logo-header' });
    const logoLink = createElement('a', { href: 'http://seletti.ru?utm_source=hybridpic&utm_medium=refferal&utm_campaign=hybappseletti', target: '_blank' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    logoLink.appendChild(logo);
    header.appendChild(logoLink);
    screen.appendChild(header);

    // Title banner
    const titleBanner = createElement('h1', { className: 'photo-ready-banner' });
    titleBanner.textContent = 'СОЗДАЁМ СВОЙ HYBRID';
    screen.appendChild(titleBanner);

    // Content container
    const content = createElement('div', { className: 'photo-ready-content' });

    // Success message
    const title = createElement('h2', { className: 'photo-ready-title' });
    title.textContent = 'Фото готово!';
    content.appendChild(title);

    // Photo preview
    const photos = this.app.getPhotos();
    if (photos.length > 0) {
      const photoContainer = createElement('div', { className: 'photo-ready-preview-container' });
      const photo = createElement('img', {
        className: 'photo-ready-preview',
        src: URL.createObjectURL(photos[0]),
        alt: 'Фото 1'
      });
      photoContainer.appendChild(photo);
      content.appendChild(photoContainer);
    }

    // Continue button
    const buttonContainer = createElement('div', { className: 'photo-ready-actions' });
    const continueButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleContinue()
    });
    continueButton.textContent = 'ДАЛЕЕ';
    buttonContainer.appendChild(continueButton);
    content.appendChild(buttonContainer);

    screen.appendChild(content);

    return screen;
  }

  handleContinue() {
    // Navigate to camera for second photo
    this.app.navigateTo('camera', { startPhotoIndex: 1 });
  }

  async mount() {
    // Screen mounted
  }

  cleanup() {
    // Clean up if needed
  }
}
