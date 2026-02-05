/**
 * Photos Ready Screen
 * Shows both captured photos with option to review or retake
 * Displays before plate selection
 */

import { createElement } from '../utils/helpers.js';
import logoUrl from '../assets/logo.png';

export class PhotosReadyScreen {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const screen = createElement('div', { className: 'screen screen-photos-ready' });

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
    const titleBanner = createElement('h1', { className: 'photos-ready-banner' });
    titleBanner.textContent = 'Создай свой Hybrid';
    screen.appendChild(titleBanner);

    // Content container
    const content = createElement('div', { className: 'photos-ready-content' });

    // Success message
    const title = createElement('h2', { className: 'photos-ready-title' });
    title.textContent = 'Фото готовы!';
    content.appendChild(title);

    // Main continue button
    const mainButtonContainer = createElement('div', { className: 'photos-ready-main-action' });
    const mainContinueButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleContinue()
    });
    mainContinueButton.textContent = 'ДАЛЕЕ';
    mainButtonContainer.appendChild(mainContinueButton);
    content.appendChild(mainButtonContainer);

    // Instruction text
    const instruction = createElement('p', { className: 'photos-ready-instruction' });
    instruction.textContent = 'Если хотите посмотреть или заменить фото, нажмите на превью';
    content.appendChild(instruction);

    // Photos grid
    const photosGrid = createElement('div', { className: 'photos-ready-grid' });

    const photos = this.app.getPhotos();

    // Photo 1 preview (clickable)
    const photo1Container = createElement('div', {
      className: 'photo-ready-card clickable',
      onClick: () => this.handleRetakePhoto(0)
    });
    const photo1 = createElement('img', {
      className: 'photo-ready-image',
      src: photos[0] ? URL.createObjectURL(photos[0]) : '',
      alt: 'Фото 1'
    });
    photo1Container.appendChild(photo1);
    photosGrid.appendChild(photo1Container);

    // Photo 2 preview (clickable)
    const photo2Container = createElement('div', {
      className: 'photo-ready-card clickable',
      onClick: () => this.handleRetakePhoto(1)
    });
    const photo2 = createElement('img', {
      className: 'photo-ready-image',
      src: photos[1] ? URL.createObjectURL(photos[1]) : '',
      alt: 'Фото 2'
    });
    photo2Container.appendChild(photo2);
    photosGrid.appendChild(photo2Container);

    content.appendChild(photosGrid);

    // Bottom continue button
    const bottomButtonContainer = createElement('div', { className: 'photos-ready-bottom-action' });
    const bottomContinueButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleContinue()
    });
    bottomContinueButton.textContent = 'ДАЛЕЕ';
    bottomButtonContainer.appendChild(bottomContinueButton);
    content.appendChild(bottomButtonContainer);

    screen.appendChild(content);

    return screen;
  }

  handleRetakePhoto(photoIndex) {
    // Return to camera to retake the selected photo
    this.app.retakePhoto(photoIndex);
  }

  handleContinue() {
    // Navigate to plate selection
    this.app.navigateTo('plateSelect');
  }

  async mount() {
    // Screen mounted
  }

  cleanup() {
    // Clean up if needed
  }
}
