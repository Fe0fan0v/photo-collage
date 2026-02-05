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
    title.textContent = 'Фото готовы!';
    content.appendChild(title);

    // Photos grid
    const photosGrid = createElement('div', { className: 'photos-ready-grid' });

    const photos = this.app.getPhotos();

    // Photo 1 preview
    const photo1Container = createElement('div', { className: 'photo-ready-card' });
    const photo1Label = createElement('div', { className: 'photo-ready-label' });
    photo1Label.textContent = 'Фото 1';
    photo1Container.appendChild(photo1Label);

    const photo1 = createElement('img', {
      className: 'photo-ready-image',
      src: photos[0] ? URL.createObjectURL(photos[0]) : '',
      alt: 'Фото 1'
    });
    photo1Container.appendChild(photo1);

    // Retake button for photo 1
    const retakeBtn1 = createElement('button', {
      className: 'btn-retake',
      onClick: (e) => {
        e.stopPropagation();
        this.handleRetakePhoto(0);
      }
    });
    retakeBtn1.textContent = 'ПЕРЕСНЯТЬ';
    photo1Container.appendChild(retakeBtn1);

    photosGrid.appendChild(photo1Container);

    // Photo 2 preview
    const photo2Container = createElement('div', { className: 'photo-ready-card' });
    const photo2Label = createElement('div', { className: 'photo-ready-label' });
    photo2Label.textContent = 'Фото 2';
    photo2Container.appendChild(photo2Label);

    const photo2 = createElement('img', {
      className: 'photo-ready-image',
      src: photos[1] ? URL.createObjectURL(photos[1]) : '',
      alt: 'Фото 2'
    });
    photo2Container.appendChild(photo2);

    // Retake button for photo 2
    const retakeBtn2 = createElement('button', {
      className: 'btn-retake',
      onClick: (e) => {
        e.stopPropagation();
        this.handleRetakePhoto(1);
      }
    });
    retakeBtn2.textContent = 'ПЕРЕСНЯТЬ';
    photo2Container.appendChild(retakeBtn2);

    photosGrid.appendChild(photo2Container);

    content.appendChild(photosGrid);

    // Continue button
    const buttonContainer = createElement('div', { className: 'photos-ready-actions' });
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

  handleRetakePhoto(photoIndex) {
    // Return to camera to retake the selected photo
    // Set the camera to start from this photo index
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
