/**
 * Camera Screen
 * Handles camera access, preview, and photo capture
 * Shows vertical guide line for face alignment
 */

import { createElement, captureVideoFrame, blobToBase64 } from '../utils/helpers.js';

export class CameraScreen {
  constructor(app) {
    this.app = app;
    this.stream = null;
    this.videoElement = null;
    this.currentPhotoIndex = 0; // 0 = first photo (left), 1 = second photo (right)
    this.photo1Thumbnail = null;
    this.photo2Thumbnail = null;
    this.instructionText = null;
  }

  async render() {
    const screen = createElement('div', { className: 'screen' });

    // Photo counter
    const counter = createElement('div', { className: 'photo-counter' });
    this.instructionText = createElement('span', { className: 'photo-counter-text' });
    this.updateInstructionText();
    counter.appendChild(this.instructionText);
    screen.appendChild(counter);

    // Camera container
    const cameraContainer = createElement('div', { className: 'camera-container' });

    // Video element
    this.videoElement = createElement('video', {
      className: 'camera-video',
      autoplay: 'true',
      playsinline: 'true',
      muted: 'true'
    });
    cameraContainer.appendChild(this.videoElement);

    // Face guide overlay
    const overlay = createElement('div', { className: 'camera-overlay' });

    // Vertical center line
    const centerLine = createElement('div', { className: 'camera-center-line' });
    overlay.appendChild(centerLine);

    // Face oval guide
    const faceGuide = createElement('div', { className: 'camera-face-guide' });
    overlay.appendChild(faceGuide);

    // Side indicator
    this.sideIndicator = createElement('div', { className: 'camera-side-indicator' });
    this.updateSideIndicator();
    overlay.appendChild(this.sideIndicator);

    cameraContainer.appendChild(overlay);
    screen.appendChild(cameraContainer);

    // Controls
    const controls = createElement('div', { className: 'camera-controls' });

    // Photo 1 thumbnail placeholder
    this.photo1Thumbnail = createElement('div', { className: 'photo-placeholder' });
    this.photo1Thumbnail.innerHTML = '<span style="font-size:10px;color:var(--text-muted)">Фото 1</span>';
    controls.appendChild(this.photo1Thumbnail);

    // Capture button
    const captureButton = createElement('button', {
      className: 'btn btn-capture',
      onClick: () => this.handleCapture()
    });
    controls.appendChild(captureButton);

    // Photo 2 thumbnail placeholder
    this.photo2Thumbnail = createElement('div', { className: 'photo-placeholder' });
    this.photo2Thumbnail.innerHTML = '<span style="font-size:10px;color:var(--text-muted)">Фото 2</span>';
    controls.appendChild(this.photo2Thumbnail);

    screen.appendChild(controls);

    // Error container (hidden by default)
    this.errorContainer = createElement('div', { className: 'error-message hidden' });
    screen.insertBefore(this.errorContainer, screen.firstChild);

    return screen;
  }

  async mount() {
    try {
      await this.startCamera();
    } catch (error) {
      this.showError('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ и обновите страницу.');
      console.error('Camera access error:', error);
    }
  }

  async startCamera() {
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.videoElement.srcObject = this.stream;

    // Wait for video to be ready
    await new Promise((resolve) => {
      this.videoElement.onloadedmetadata = resolve;
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async handleCapture() {
    if (!this.stream) return;

    try {
      const photoBlob = await captureVideoFrame(this.videoElement);
      const photoDataUrl = await blobToBase64(photoBlob);

      // Add photo to app state
      this.app.addPhoto(photoBlob);

      if (this.currentPhotoIndex === 0) {
        // First photo captured
        this.updateThumbnail(this.photo1Thumbnail, photoDataUrl);
        this.currentPhotoIndex = 1;
        this.updateInstructionText();
        this.updateSideIndicator();
      } else {
        // Second photo captured
        this.updateThumbnail(this.photo2Thumbnail, photoDataUrl);
        // Navigate to plate selection screen
        this.app.navigateTo('plateSelect');
      }
    } catch (error) {
      this.showError('Ошибка при захвате фото. Попробуйте еще раз.');
      console.error('Photo capture error:', error);
    }
  }

  updateThumbnail(container, dataUrl) {
    container.className = '';
    container.innerHTML = '';
    const img = createElement('img', {
      className: 'photo-thumbnail',
      src: dataUrl
    });
    container.appendChild(img);
  }

  updateInstructionText() {
    if (this.currentPhotoIndex === 0) {
      this.instructionText.innerHTML = `
        <span class="photo-counter-highlight">Человек 1:</span>
        Расположите лицо слева от линии
      `;
    } else {
      this.instructionText.innerHTML = `
        <span class="photo-counter-highlight">Человек 2:</span>
        Расположите лицо справа от линии
      `;
    }
  }

  updateSideIndicator() {
    if (this.currentPhotoIndex === 0) {
      this.sideIndicator.className = 'camera-side-indicator left';
      this.sideIndicator.textContent = 'Левая половина';
    } else {
      this.sideIndicator.className = 'camera-side-indicator right';
      this.sideIndicator.textContent = 'Правая половина';
    }
  }

  showError(message) {
    this.errorContainer.textContent = message;
    this.errorContainer.classList.remove('hidden');
  }

  cleanup() {
    this.stopCamera();
    this.currentPhotoIndex = 0;
  }
}
