/**
 * Photo Review Screen
 * Shows single photo with retake and gallery options
 */

import { createElement } from '../utils/helpers.js';
import { processFace } from '../services/background-removal.js';
import logoUrl from '../assets/logo.png';

export class PhotoReviewScreen {
  constructor(app) {
    this.app = app;
    this.photoIndex = 0; // 0 for photo 1, 1 for photo 2
  }

  async render(params = {}) {
    this.photoIndex = params.photoIndex || 0;
    const screen = createElement('div', { className: 'screen screen-photo-review' });

    // Logo header
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

    // Title banner
    const titleBanner = createElement('h1', { className: 'photo-review-banner' });
    titleBanner.textContent = 'Создай свой Hybrid';
    screen.appendChild(titleBanner);

    // Photo container
    const photoContainer = createElement('div', { className: 'photo-review-container' });

    // Static photo with oval
    const photoWrapper = createElement('div', { className: 'photo-review-wrapper' });

    const photos = this.app.getPhotos();
    const photo = photos[this.photoIndex];

    if (photo) {
      this.photoElement = createElement('img', {
        className: 'photo-review-image',
        src: URL.createObjectURL(photo),
        alt: `Фото ${this.photoIndex + 1}`
      });
      photoWrapper.appendChild(this.photoElement);
    }

    // Oval overlay with retake button
    const overlay = createElement('div', { className: 'photo-review-overlay' });

    // Center line
    const centerLine = createElement('div', { className: 'photo-review-center-line' });
    overlay.appendChild(centerLine);

    const ovalGuide = createElement('div', { className: 'photo-review-oval' });
    overlay.appendChild(ovalGuide);

    // Half overlay for shading (shade opposite side)
    const halfOverlay = createElement('div', {
      className: `photo-review-half-overlay ${this.photoIndex === 0 ? 'right' : 'left'}`
    });
    overlay.appendChild(halfOverlay);

    // Retake button (positioned on the side being retaken)
    // Photo 1 (left side) -> button on left
    // Photo 2 (right side) -> button on right
    const retakeButton = createElement('button', {
      className: `btn-retake-oval ${this.photoIndex === 0 ? 'left' : 'right'}`,
      onClick: () => this.handleRetake()
    });
    retakeButton.textContent = 'ПЕРЕСНЯТЬ';
    overlay.appendChild(retakeButton);

    photoWrapper.appendChild(overlay);
    photoContainer.appendChild(photoWrapper);

    // Instruction text
    const instruction = createElement('div', { className: 'photo-review-instruction' });
    instruction.textContent = 'Поместите лицо в овал. Разделение произойдет по желтой линии';
    photoContainer.appendChild(instruction);

    screen.appendChild(photoContainer);

    // Controls
    const controls = createElement('div', { className: 'photo-review-controls' });

    // Preview thumbnail (clickable for gallery)
    this.previewThumbnail = createElement('div', {
      className: 'photo-review-preview clickable',
      onClick: () => this.handleGallerySelect()
    });

    if (photo) {
      const previewImg = createElement('img', {
        className: 'photo-review-preview-image',
        src: URL.createObjectURL(photo),
        alt: 'Preview'
      });
      this.previewThumbnail.appendChild(previewImg);
    }

    controls.appendChild(this.previewThumbnail);

    // Yellow circle (decorative)
    const yellowCircle = createElement('div', { className: 'photo-review-circle' });
    controls.appendChild(yellowCircle);

    // Continue button
    const continueButton = createElement('button', {
      className: 'btn btn-primary btn-photo-review-continue',
      onClick: () => this.handleContinue()
    });
    continueButton.textContent = 'ДАЛЕЕ';
    controls.appendChild(continueButton);

    screen.appendChild(controls);

    // Hidden file input for gallery
    this.fileInput = createElement('input', {
      type: 'file',
      accept: 'image/*',
      style: { display: 'none' },
      onChange: (e) => this.handleFileSelect(e)
    });
    screen.appendChild(this.fileInput);

    return screen;
  }

  handleRetake() {
    // Return to camera to retake this photo
    this.app.retakePhoto(this.photoIndex);
  }

  handleGallerySelect() {
    // Open file picker
    this.fileInput.click();
  }

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Convert file to blob
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });

      // Replace photo in app state
      const photos = this.app.getPhotos();
      photos[this.photoIndex] = blob;

      // Update preview
      const photoUrl = URL.createObjectURL(blob);

      // Update main photo
      if (this.photoElement) {
        this.photoElement.src = photoUrl;
      }

      // Update thumbnail
      if (this.previewThumbnail) {
        this.previewThumbnail.innerHTML = '';
        const previewImg = createElement('img', {
          className: 'photo-review-preview-image',
          src: photoUrl,
          alt: 'Preview'
        });
        this.previewThumbnail.appendChild(previewImg);
      }

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error selecting photo from gallery:', error);
    }
  }

  handleContinue() {
    // Return to photos ready screen
    this.app.navigateTo('photosReady');
  }

  async mount() {
    // Screen mounted
  }

  cleanup() {
    // Clean up if needed
  }
}
