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

    // Content container
    const content = createElement('div', { className: 'photos-ready-content' });

    // Success message
    const title = createElement('h2', { className: 'photos-ready-title' });
    title.textContent = 'ПОЧТИ ВСЁ ГОТОВО!';
    content.appendChild(title);

    // Instruction text
    const instruction = createElement('p', { className: 'photos-ready-instruction' });
    instruction.textContent = 'Теперь выберите фон для вашего гибрида';
    content.appendChild(instruction);

    // Photos grid
    const photosGrid = createElement('div', { className: 'photos-ready-grid' });

    const photos = this.app.getPhotos();

    // Photo 1 preview
    const photo1Container = createElement('div', { className: 'photo-ready-card' });
    const photo1 = createElement('img', {
      className: 'photo-ready-image',
      src: photos[0] ? URL.createObjectURL(photos[0]) : '',
      alt: 'Фото 1'
    });
    photo1Container.appendChild(photo1);
    photosGrid.appendChild(photo1Container);

    // Photo 2 preview
    const photo2Container = createElement('div', { className: 'photo-ready-card' });
    const photo2 = createElement('img', {
      className: 'photo-ready-image',
      src: photos[1] ? URL.createObjectURL(photos[1]) : '',
      alt: 'Фото 2'
    });
    photo2Container.appendChild(photo2);
    photosGrid.appendChild(photo2Container);

    content.appendChild(photosGrid);

    // Continue button
    const buttonContainer = createElement('div', { className: 'photos-ready-actions' });
    const continueButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleContinue()
    });
    continueButton.textContent = 'СОЗДАТЬ ГИБРИД';
    buttonContainer.appendChild(continueButton);
    content.appendChild(buttonContainer);

    screen.appendChild(content);

    return screen;
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
