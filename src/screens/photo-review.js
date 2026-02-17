/**
 * Photo Review Screen
 * Shows single photo with retake and gallery options
 */

import { createElement } from '../utils/helpers.js';
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

    // Controls: [photo1 thumb] [yellow circle] [photo2 thumb]
    const controls = createElement('div', { className: 'photo-review-controls' });

    // Photo 1 thumbnail
    this.thumb1 = createElement('div', {
      className: 'photo-review-preview clickable',
      onClick: () => this.handleThumbClick(0)
    });
    if (photos[0]) {
      const img1 = createElement('img', {
        className: 'photo-review-preview-image',
        src: URL.createObjectURL(photos[0]),
        alt: 'Фото 1'
      });
      this.thumb1.appendChild(img1);
    }
    controls.appendChild(this.thumb1);

    // Yellow circle (decorative)
    const yellowCircle = createElement('div', { className: 'photo-review-circle' });
    controls.appendChild(yellowCircle);

    // Photo 2 thumbnail
    this.thumb2 = createElement('div', {
      className: 'photo-review-preview clickable',
      onClick: () => this.handleThumbClick(1)
    });
    if (photos[1]) {
      const img2 = createElement('img', {
        className: 'photo-review-preview-image',
        src: URL.createObjectURL(photos[1]),
        alt: 'Фото 2'
      });
      this.thumb2.appendChild(img2);
    }
    controls.appendChild(this.thumb2);

    screen.appendChild(controls);

    // Continue button (below thumbnails)
    const continueButton = createElement('button', {
      className: 'btn btn-primary btn-photo-review-continue',
      onClick: () => this.handleContinue()
    });
    continueButton.textContent = 'ДАЛЕЕ';
    screen.appendChild(continueButton);

    return screen;
  }

  handleRetake() {
    // Return to camera to retake this photo
    this.app.retakePhoto(this.photoIndex);
  }

  handleThumbClick(thumbIndex) {
    // Clicking the thumbnail of the photo being reviewed opens file picker to replace it
    if (thumbIndex === this.photoIndex) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', (e) => {
        this.handleFileSelect(e, thumbIndex);
        input.remove();
      });
      document.body.appendChild(input);
      input.click();
    }
  }

  async handleFileSelect(event, targetIndex) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const photoUrl = URL.createObjectURL(blob);

      // Replace photo in app state
      const photos = this.app.getPhotos();
      photos[targetIndex] = blob;

      // Update main photo if replacing the currently viewed photo
      if (targetIndex === this.photoIndex && this.photoElement) {
        this.photoElement.src = photoUrl;
      }

      // Update the corresponding thumbnail
      const thumb = targetIndex === 0 ? this.thumb1 : this.thumb2;
      if (thumb) {
        thumb.innerHTML = '';
        const previewImg = createElement('img', {
          className: 'photo-review-preview-image',
          src: photoUrl,
          alt: `Фото ${targetIndex + 1}`
        });
        thumb.appendChild(previewImg);
      }
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
