/**
 * Photo Collage App - Main Entry Point
 * Creates plate-framed face mashup from two people's photos
 */

import { WelcomeScreen } from './screens/welcome.js';
import { CameraScreen } from './screens/camera.js';
import { PhotoReadyScreen } from './screens/photo-ready.js';
import { PhotosReadyScreen } from './screens/photos-ready.js';
import { PlateSelectScreen } from './screens/plate-select.js';
import { ProcessingScreen } from './screens/processing.js';
import { EmailFormScreen } from './screens/email-form.js';
import { SuccessScreen } from './screens/success.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.state = {
      photos: [], // Array of captured photo Blobs [left, right]
      selectedPlate: null, // Selected plate index (0, 1, 2)
      collageDataUrl: null, // Final collage as data URL
      email: null
    };

    this.screens = {
      welcome: new WelcomeScreen(this),
      camera: new CameraScreen(this),
      photoReady: new PhotoReadyScreen(this),
      photosReady: new PhotosReadyScreen(this),
      plateSelect: new PlateSelectScreen(this),
      processing: new ProcessingScreen(this),
      emailForm: new EmailFormScreen(this),
      success: new SuccessScreen(this)
    };

    this.currentScreen = null;
  }

  /**
   * Initialize the app
   */
  init() {
    this.navigateTo('welcome');
  }

  /**
   * Navigate to a screen
   * @param {string} screenName
   * @param {Object} params - Optional parameters to pass to the screen
   */
  async navigateTo(screenName, params = {}) {
    // Cleanup current screen
    if (this.currentScreen) {
      await this.currentScreen.cleanup?.();
    }

    // Clear container
    this.container.innerHTML = '';

    // Get new screen
    const screen = this.screens[screenName];
    if (!screen) {
      console.error(`Screen "${screenName}" not found`);
      return;
    }

    this.currentScreen = screen;

    // Render and mount new screen
    const element = await screen.render(params);
    this.container.appendChild(element);

    // Initialize screen with params
    await screen.mount?.(params);
  }

  /**
   * Add captured photo to state
   * @param {Blob} photo
   */
  addPhoto(photo) {
    this.state.photos.push(photo);
  }

  /**
   * Get captured photos
   * @returns {Blob[]}
   */
  getPhotos() {
    return this.state.photos;
  }

  /**
   * Retake a specific photo (go back to camera)
   * @param {number} photoIndex - Index of photo to retake (0 or 1)
   */
  retakePhoto(photoIndex) {
    // Remove photos from the index onwards
    this.state.photos = this.state.photos.slice(0, photoIndex);
    // Navigate to camera with photo index
    this.navigateTo('camera', { startPhotoIndex: photoIndex });
  }

  /**
   * Set selected plate
   * @param {number} plateIndex
   */
  setSelectedPlate(plateIndex) {
    this.state.selectedPlate = plateIndex;
  }

  /**
   * Get selected plate
   * @returns {number}
   */
  getSelectedPlate() {
    return this.state.selectedPlate;
  }

  /**
   * Set collage data URL
   * @param {string} dataUrl
   */
  setCollage(dataUrl) {
    this.state.collageDataUrl = dataUrl;
  }

  /**
   * Get collage data URL
   * @returns {string}
   */
  getCollage() {
    return this.state.collageDataUrl;
  }

  /**
   * Set user email
   * @param {string} email
   */
  setEmail(email) {
    this.state.email = email;
  }

  /**
   * Get user email
   * @returns {string}
   */
  getEmail() {
    return this.state.email;
  }

  /**
   * Reset app state
   */
  reset() {
    this.state = {
      photos: [],
      selectedPlate: null,
      collageDataUrl: null,
      email: null
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
