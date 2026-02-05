/**
 * Camera Screen
 * Handles camera access, preview, and photo capture
 * Shows vertical guide line for face alignment
 */

import { createElement, captureVideoFrame, blobToBase64, loadImage } from '../utils/helpers.js';
import { processFace, preloadModel } from '../services/background-removal.js';
import logoUrl from '../assets/logo.png';

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

  async render(params = {}) {
    // Support starting from a specific photo index (for retakes)
    if (params.startPhotoIndex !== undefined) {
      this.currentPhotoIndex = params.startPhotoIndex;
    } else {
      this.currentPhotoIndex = 0;
    }

    const screen = createElement('div', { className: 'screen screen-camera' });

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
    const titleBanner = createElement('h1', { className: 'camera-banner' });
    titleBanner.textContent = 'Создай свой Hybrid';
    screen.appendChild(titleBanner);

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
    this.faceGuide = createElement('div', { className: 'camera-face-guide' });
    overlay.appendChild(this.faceGuide);

    // Half overlay for shading (left or right side)
    this.halfOverlay = createElement('div', { className: 'camera-half-overlay right' });
    overlay.appendChild(this.halfOverlay);

    // Success checkmark animation (hidden by default)
    this.successCheckmark = createElement('div', { className: 'camera-success-checkmark' });
    this.successCheckmark.innerHTML = `
      <svg viewBox="0 0 52 52">
        <polyline points="14 27 22 35 38 19" />
      </svg>
    `;
    overlay.appendChild(this.successCheckmark);

    cameraContainer.appendChild(overlay);
    screen.appendChild(cameraContainer);

    // Instruction text under camera
    const instructionContainer = createElement('div', { className: 'camera-instruction' });
    this.instructionText = createElement('span', { className: 'camera-instruction-text' });
    this.instructionText.textContent = 'Поместите лицо в овал. Разделение произойдет по желтой линии';
    instructionContainer.appendChild(this.instructionText);
    screen.appendChild(instructionContainer);

    // Controls
    const controls = createElement('div', { className: 'camera-controls' });

    // Photo 1 thumbnail placeholder (clickable to open gallery)
    this.photo1Thumbnail = createElement('div', {
      className: 'photo-placeholder clickable',
      onClick: () => this.handlePhoto1Click()
    });
    this.photo1Thumbnail.innerHTML = '<span style="font-size:9px;color:var(--text-color);line-height:1.2;text-align:center;">Фото 1<br>Загрузь</span>';
    controls.appendChild(this.photo1Thumbnail);

    // Hidden file input for gallery selection
    this.fileInput = createElement('input', {
      type: 'file',
      accept: 'image/*',
      style: { display: 'none' },
      onChange: (e) => this.handleGallerySelect(e)
    });
    screen.appendChild(this.fileInput);

    // Capture button
    const captureButton = createElement('button', {
      className: 'btn btn-capture',
      onClick: () => this.handleCapture()
    });
    controls.appendChild(captureButton);

    // Photo 2 thumbnail placeholder
    this.photo2Thumbnail = createElement('div', { className: 'photo-placeholder' });
    this.photo2Thumbnail.innerHTML = '<span style="font-size:9px;color:var(--text-color);line-height:1.2;text-align:center;">Фото 2<br>Загрузь</span>';
    controls.appendChild(this.photo2Thumbnail);

    screen.appendChild(controls);

    // Error container (hidden by default)
    this.errorContainer = createElement('div', { className: 'error-message hidden' });
    screen.insertBefore(this.errorContainer, screen.firstChild);

    return screen;
  }

  async mount() {
    // Restore existing photos if retaking
    await this.restoreExistingPhotos();

    // Check API availability
    const apiAvailable = await preloadModel();
    if (!apiAvailable) {
      this.showError('⚠️ Backend сервер не отвечает. Обработка фото будет недоступна.');
    }

    try {
      await this.startCamera();
    } catch (error) {
      this.showError('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ и обновите страницу.');
      console.error('Camera access error:', error);
    }
  }

  async restoreExistingPhotos() {
    const photos = this.app.getPhotos();

    // Restore photo 1 if it exists
    if (photos.length > 0 && this.currentPhotoIndex >= 1) {
      const photo1DataUrl = URL.createObjectURL(photos[0]);
      this.photo1DataUrl = photo1DataUrl;
      this.updateThumbnail(this.photo1Thumbnail, photo1DataUrl);

      // Process photo 1 in background (no preview needed)
      try {
        const processed = await processFace(photos[0]);
        this.photo1FaceData = processed;
      } catch (error) {
        console.error('Failed to process photo 1 for preview:', error);
      }
    }

    // Update half overlay position based on current photo
    this.updateHalfOverlay();
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

      // Show success animation
      this.showSuccessAnimation();

      if (this.currentPhotoIndex === 0) {
        // First photo captured - stay on camera, update for photo 2
        this.photo1DataUrl = photoDataUrl;
        this.updateThumbnail(this.photo1Thumbnail, photoDataUrl);

        // Process photo 1 in background for preview
        this.processPhoto1ForPreview(photoBlob);

        // Move to photo 2
        this.currentPhotoIndex = 1;
        this.updateHalfOverlay();
      } else {
        // Second photo captured
        this.updateThumbnail(this.photo2Thumbnail, photoDataUrl);
        // Navigate to photos ready screen
        this.app.navigateTo('photosReady');
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

  updateHalfOverlay() {
    if (!this.halfOverlay) return;

    if (this.currentPhotoIndex === 0) {
      // First photo - shade right half
      this.halfOverlay.className = 'camera-half-overlay right';
    } else {
      // Second photo - shade left half
      this.halfOverlay.className = 'camera-half-overlay left';
    }
  }

  handlePhoto1Click() {
    // Only allow clicking if we're on photo 2 (after photo 1 is taken)
    if (this.currentPhotoIndex >= 1) {
      this.fileInput.click();
    }
  }

  async processPhoto1ForPreview(photoBlob) {
    // Process photo 1 in background (for later use in collage)
    // No need to show preview in oval - just half overlay is enough
    try {
      const processed = await processFace(photoBlob);
      this.photo1FaceData = processed;
    } catch (error) {
      console.error('Failed to process photo 1 for preview:', error);
    }
  }

  async handleGallerySelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Convert file to blob
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });

      // Replace photo 1 in app state
      const photos = this.app.getPhotos();
      photos[0] = blob;

      // Update thumbnail
      const photoDataUrl = URL.createObjectURL(blob);
      this.photo1DataUrl = photoDataUrl;
      this.updateThumbnail(this.photo1Thumbnail, photoDataUrl);

      // Process and update preview
      await this.processPhoto1ForPreview(blob);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error handling gallery selection:', error);
      this.showError('Не удалось загрузить фото из галереи');
    }
  }

  showSuccessAnimation() {
    // Show checkmark animation
    if (this.successCheckmark) {
      this.successCheckmark.classList.add('show');

      // Hide after animation
      setTimeout(() => {
        this.successCheckmark.classList.remove('show');
      }, 1000);
    }

    // Add pulsing animation to face guide
    if (this.faceGuide) {
      this.faceGuide.classList.add('processing');

      setTimeout(() => {
        this.faceGuide.classList.remove('processing');
      }, 1000);
    }
  }

  showProcessingIndicator() {
    // Show text indicator
    if (this.instructionText) {
      this.instructionText.innerHTML = '<span style="opacity: 0.7">⏳ Обработка...</span>';
    }

    // Add pulsing animation to face guide
    if (this.faceGuide) {
      this.faceGuide.classList.add('processing');
    }

    // Show checkmark animation
    if (this.successCheckmark) {
      this.successCheckmark.classList.add('show');
    }
  }

  hideProcessingIndicator() {
    // Update instruction text
    this.updateInstructionText();

    // Remove pulsing animation from face guide
    if (this.faceGuide) {
      this.faceGuide.classList.remove('processing');
    }

    // Hide checkmark after a delay (keep it visible for a moment)
    if (this.successCheckmark) {
      setTimeout(() => {
        this.successCheckmark.classList.remove('show');
      }, 500);
    }
  }

  async showPhoto1Preview(imageUrl, faceInfo) {
    if (!this.photo1Preview || !imageUrl) return;

    try {
      // Create canvas with cropped face only
      const croppedFace = await this.createCroppedFaceCanvas(imageUrl, faceInfo);
      this.photo1Preview.style.backgroundImage = `url(${croppedFace})`;
      this.photo1Preview.classList.remove('hidden');
    } catch (error) {
      console.error('Failed to create cropped face preview:', error);
    }
  }

  /**
   * Create canvas with only the LEFT HALF of the face (from forehead to chin)
   */
  async createCroppedFaceCanvas(imageUrl, faceInfo) {
    const img = await loadImage(imageUrl);

    // Get face bounds with padding for hair
    let faceX, faceY, faceW, faceH;

    if (faceInfo && faceInfo.found) {
      // Add padding: 40% above for hair, 15% below for chin, 20% on sides
      const paddingTop = faceInfo.height * 0.4;
      const paddingBottom = faceInfo.height * 0.15;
      const paddingSide = faceInfo.width * 0.2;

      faceX = Math.max(0, faceInfo.x - paddingSide) * img.width;
      faceY = Math.max(0, faceInfo.y - paddingTop) * img.height;
      faceW = (faceInfo.width + paddingSide * 2) * img.width;
      faceH = (faceInfo.height + paddingTop + paddingBottom) * img.height;

      // Clamp to image bounds
      faceW = Math.min(faceW, img.width - faceX);
      faceH = Math.min(faceH, img.height - faceY);
    } else {
      // Fallback: use center portion of image
      faceX = img.width * 0.15;
      faceY = img.height * 0.05;
      faceW = img.width * 0.7;
      faceH = img.height * 0.8;
    }

    // Create canvas with LEFT HALF of face only
    const canvas = document.createElement('canvas');
    canvas.width = faceW / 2;  // Only left half
    canvas.height = faceH;
    const ctx = canvas.getContext('2d');

    // Draw only left half of the cropped face
    ctx.drawImage(img, faceX, faceY, faceW / 2, faceH, 0, 0, faceW / 2, faceH);

    return canvas.toDataURL('image/png');
  }

  /**
   * Create a canvas with the face properly positioned in an oval
   * Uses same logic as collage.js - aligns by eye position
   */
  async createFacePreviewCanvas(imageDataUrl, faceInfo) {
    const FACE_WIDTH = 580;
    const FACE_HEIGHT = 720;

    const canvas = document.createElement('canvas');
    canvas.width = FACE_WIDTH;
    canvas.height = FACE_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Load the processed image
    const img = await loadImage(imageDataUrl);

    // Get face and eye coordinates in pixels
    const faceData = this.getFacePixelCoords(img, faceInfo);

    // Use inter-eye distance for scaling (same as collage.js)
    const radiusX = FACE_WIDTH / 2;
    const radiusY = FACE_HEIGHT / 2;
    const targetEyeDistance = radiusX * 2 * 0.28;
    const scale = targetEyeDistance / faceData.eyeDistance;

    // Target eye position: eyes should be at ~45% from top of oval
    const targetEyeY = FACE_HEIGHT * 0.45;

    // Calculate positioning based on eye center
    const scaledWidth = faceData.imgWidth * scale;
    const scaledHeight = faceData.imgHeight * scale;
    const scaledEyeCenterX = faceData.eyeCenterX * scale;
    const scaledEyeCenterY = faceData.eyeCenterY * scale;

    const centerX = FACE_WIDTH / 2;

    const offsetX = centerX - scaledEyeCenterX;
    const offsetY = targetEyeY - scaledEyeCenterY;

    // Draw the image with proper positioning
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    return canvas;
  }

  /**
   * Get face and eye coordinates in pixels (with fallback)
   */
  getFacePixelCoords(img, faceInfo) {
    const imgWidth = img.width;
    const imgHeight = img.height;

    if (faceInfo && faceInfo.found) {
      // Get eye data if available
      let eyeCenterX, eyeCenterY, eyeDistance;

      if (faceInfo.eyes) {
        eyeCenterX = faceInfo.eyes.center.x * imgWidth;
        eyeCenterY = faceInfo.eyes.center.y * imgHeight;
        eyeDistance = faceInfo.eyes.distance * imgWidth;
      } else {
        // Estimate eye position from face bounds
        eyeCenterX = (faceInfo.x + faceInfo.width / 2) * imgWidth;
        eyeCenterY = (faceInfo.y + faceInfo.height * 0.35) * imgHeight;
        eyeDistance = faceInfo.width * imgWidth * 0.4;
      }

      return {
        faceX: faceInfo.x * imgWidth,
        faceY: faceInfo.y * imgHeight,
        faceW: faceInfo.width * imgWidth,
        faceH: faceInfo.height * imgHeight,
        eyeCenterX,
        eyeCenterY,
        eyeDistance,
        imgWidth,
        imgHeight
      };
    }

    // Fallback: assume face is roughly in the upper-middle portion
    const fallbackFaceW = imgWidth * 0.5;
    const fallbackFaceH = imgHeight * 0.4;
    const fallbackFaceX = imgWidth * 0.25;
    const fallbackFaceY = imgHeight * 0.15;

    return {
      faceX: fallbackFaceX,
      faceY: fallbackFaceY,
      faceW: fallbackFaceW,
      faceH: fallbackFaceH,
      eyeCenterX: fallbackFaceX + fallbackFaceW / 2,
      eyeCenterY: fallbackFaceY + fallbackFaceH * 0.35,
      eyeDistance: fallbackFaceW * 0.4,
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
