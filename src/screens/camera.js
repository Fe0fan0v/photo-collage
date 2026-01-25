/**
 * Camera Screen
 * Handles camera access, preview, and photo capture
 * Shows vertical guide line for face alignment
 */

import { createElement, captureVideoFrame, blobToBase64, loadImage } from '../utils/helpers.js';
import { processFace } from '../services/background-removal.js';

export class CameraScreen {
  constructor(app) {
    this.app = app;
    this.stream = null;
    this.videoElement = null;
    this.currentPhotoIndex = 0; // 0 = first photo (left), 1 = second photo (right)
    this.photo1Thumbnail = null;
    this.photo2Thumbnail = null;
    this.instructionText = null;
    this.photo1Preview = null; // Canvas preview of photo 1 when taking photo 2
    this.photo1DataUrl = null; // Store photo 1 data URL
    this.photo1FaceData = null; // Store face detection data for photo 1
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

    // Photo 1 preview (shown only when taking photo 2)
    this.photo1Preview = createElement('div', { className: 'camera-photo1-preview hidden' });
    overlay.appendChild(this.photo1Preview);

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
        // First photo captured - process it to get face detection data
        this.photo1DataUrl = photoDataUrl;
        this.updateThumbnail(this.photo1Thumbnail, photoDataUrl);
        this.updateInstructionText();
        this.updateSideIndicator();

        // Process photo 1 to get face data and show preview
        this.showProcessingIndicator();
        try {
          const processed = await processFace(photoBlob);
          this.photo1FaceData = processed;
          await this.showPhoto1Preview();
        } catch (error) {
          console.error('Failed to process photo 1:', error);
          // Continue anyway with fallback positioning
        }
        this.hideProcessingIndicator();

        this.currentPhotoIndex = 1;
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

  showProcessingIndicator() {
    if (this.instructionText) {
      this.instructionText.innerHTML = '<span style="opacity: 0.7">⏳ Обработка...</span>';
    }
  }

  hideProcessingIndicator() {
    this.updateInstructionText();
  }

  async showPhoto1Preview() {
    if (!this.photo1Preview || !this.photo1FaceData) return;

    try {
      // Create canvas for preview with correct face positioning
      const previewCanvas = await this.createFacePreviewCanvas(
        this.photo1FaceData.image,
        this.photo1FaceData.face
      );

      // Convert canvas to data URL and set as background
      const previewDataUrl = previewCanvas.toDataURL('image/png');
      this.photo1Preview.style.backgroundImage = `url(${previewDataUrl})`;
      this.photo1Preview.classList.remove('hidden');
    } catch (error) {
      console.error('Failed to create face preview:', error);
      // Fallback: show original photo
      if (this.photo1DataUrl) {
        this.photo1Preview.style.backgroundImage = `url(${this.photo1DataUrl})`;
        this.photo1Preview.classList.remove('hidden');
      }
    }
  }

  /**
   * Create a canvas with the face properly positioned in an oval
   * Uses same logic as collage.js
   */
  async createFacePreviewCanvas(imageDataUrl, faceInfo) {
    const FACE_WIDTH = 500;
    const FACE_HEIGHT = 620;

    const canvas = document.createElement('canvas');
    canvas.width = FACE_WIDTH;
    canvas.height = FACE_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Load the processed image
    const img = await loadImage(imageDataUrl);

    // Get face coordinates in pixels
    const faceData = this.getFacePixelCoords(img, faceInfo);

    // Calculate scale to match target face height (75% of oval height)
    const radiusY = FACE_HEIGHT / 2;
    const targetFaceHeight = radiusY * 2 * 0.75;
    const scale = targetFaceHeight / faceData.faceH;

    // Calculate positioning
    const scaledWidth = faceData.imgWidth * scale;
    const scaledHeight = faceData.imgHeight * scale;
    const scaledFaceX = faceData.faceX * scale;
    const scaledFaceY = faceData.faceY * scale;
    const scaledFaceW = faceData.faceW * scale;
    const scaledFaceCenterX = scaledFaceX + scaledFaceW / 2;

    const centerX = FACE_WIDTH / 2;
    const centerY = FACE_HEIGHT / 2;
    const faceTopY = centerY - radiusY + (radiusY * 2 - targetFaceHeight) / 2;

    const offsetX = centerX - scaledFaceCenterX;
    const offsetY = faceTopY - scaledFaceY;

    // Draw the image with proper positioning
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    return canvas;
  }

  /**
   * Get face coordinates in pixels (with fallback)
   */
  getFacePixelCoords(img, faceInfo) {
    const imgWidth = img.width;
    const imgHeight = img.height;

    if (faceInfo && faceInfo.found) {
      return {
        faceX: faceInfo.x * imgWidth,
        faceY: faceInfo.y * imgHeight,
        faceW: faceInfo.width * imgWidth,
        faceH: faceInfo.height * imgHeight,
        imgWidth,
        imgHeight
      };
    }

    // Fallback: assume face is roughly in the upper-middle portion
    return {
      faceX: imgWidth * 0.25,
      faceY: imgHeight * 0.15,
      faceW: imgWidth * 0.5,
      faceH: imgHeight * 0.4,
      imgWidth,
      imgHeight
    };
  }

  showError(message) {
    this.errorContainer.textContent = message;
    this.errorContainer.classList.remove('hidden');
  }

  cleanup() {
    this.stopCamera();
    this.currentPhotoIndex = 0;
    this.photo1DataUrl = null;
    this.photo1FaceData = null;
  }
}
