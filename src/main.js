/**
 * Photo Collage App - Main Entry Point
 * Creates plate-framed face mashup from two people's photos
 */

import { CameraScreen } from "./screens/camera.js";
import { PhotoReadyScreen } from "./screens/photo-ready.js";
import { PhotoReviewScreen } from "./screens/photo-review.js";
import { PhotosReadyScreen } from "./screens/photos-ready.js";
import { PlateSelectScreen } from "./screens/plate-select.js";
import { ProcessingScreen } from "./screens/processing.js";
import { EmailFormScreen } from "./screens/email-form.js";
import { SuccessScreen } from "./screens/success.js";
import { TelegramPromoScreen } from "./screens/telegram-promo.js";
import { FinalScreen } from "./screens/final.js";
import {
  saveSession,
  restoreSession,
  clearSession,
} from "./utils/session-persistence.js";

class App {
  constructor() {
    this.container = document.getElementById("app");
    this.state = {
      photos: [], // Array of captured photo Blobs [left, right]
      selectedPlate: null, // Selected plate index (0, 1, 2)
      collageDataUrl: null, // Final collage as data URL
      emails: [], // Array of {email, customerType} objects
    };

    this.screens = {
      camera: new CameraScreen(this),
      photoReady: new PhotoReadyScreen(this),
      photoReview: new PhotoReviewScreen(this),
      photosReady: new PhotosReadyScreen(this),
      plateSelect: new PlateSelectScreen(this),
      processing: new ProcessingScreen(this),
      emailForm: new EmailFormScreen(this),
      success: new SuccessScreen(this),
      telegramPromo: new TelegramPromoScreen(this),
      final: new FinalScreen(this),
    };

    this.currentScreen = null;
    this.currentScreenName = null;
    this._navCounter = 0;

    // Handle returning from background (phone lock, tab switch, app switch)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.handleResume();
      }
    });
  }

  /**
   * Initialize the app
   */
  async init() {
    // Try to restore saved session (survives phone lock / page reload)
    const saved = await restoreSession();
    if (saved) {
      this.state = saved.state;
      this.navigateTo(saved.screen);
    } else {
      this.navigateTo("camera");
    }
  }

  /**
   * Handle returning from background (visibilitychange → visible)
   * Restarts camera if on camera screen, otherwise re-renders current screen
   */
  async handleResume() {
    if (!this.currentScreen) return;

    if (this.currentScreenName === "camera") {
      // Camera stream dies when app goes to background — restart it
      if (this.currentScreen.restartCamera) {
        this.currentScreen.restartCamera();
      }
    }

    // Force browser repaint — mobile browsers may blank the page after background
    document.body.style.display = "none";
    document.body.offsetHeight; // force reflow
    document.body.style.display = "";
  }

  /**
   * Navigate to a screen
   * @param {string} screenName
   * @param {Object} params - Optional parameters to pass to the screen
   */
  async navigateTo(screenName, params = {}) {
    // Guard against concurrent navigations (e.g. user taps while mount() is still running)
    const navId = ++this._navCounter;

    // Cleanup current screen
    if (this.currentScreen) {
      await this.currentScreen.cleanup?.();
    }

    // Abort if a newer navigation was started while we were cleaning up
    if (navId !== this._navCounter) return;

    // Clear container
    this.container.innerHTML = "";

    // Get new screen
    const screen = this.screens[screenName];
    if (!screen) {
      console.error(`Screen "${screenName}" not found`);
      return;
    }

    this.currentScreen = screen;
    this.currentScreenName = screenName;

    // Render and mount new screen
    const element = await screen.render(params);

    // Abort if a newer navigation was started while we were rendering
    if (navId !== this._navCounter) return;

    this.container.appendChild(element);

    // Initialize screen with params
    await screen.mount?.(params);

    // Only save session if this is still the active navigation
    if (navId === this._navCounter) {
      saveSession(screenName, this.state);
    }
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
    // Remove only the specific photo, keep the other one
    if (photoIndex < this.state.photos.length) {
      this.state.photos[photoIndex] = null;
    }
    // Navigate to camera with photo index
    this.navigateTo("camera", { startPhotoIndex: photoIndex });
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
   * Set user emails with customer types
   * @param {Array<{email: string, customerType: string}>} emails
   */
  setEmails(emails) {
    this.state.emails = emails;
  }

  /**
   * Get user emails
   * @returns {Array<{email: string, customerType: string}>}
   */
  getEmails() {
    return this.state.emails;
  }

  /**
   * Reset app state
   */
  reset() {
    this.state = {
      photos: [],
      selectedPlate: null,
      collageDataUrl: null,
      emails: [],
    };
    clearSession();
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.pathname === "/tumbler") {
    const { TumblerScreen } = await import("./screens/tumbler.js");
    const tumbler = new TumblerScreen();
    const container = document.getElementById("app");
    const el = await tumbler.render();
    container.appendChild(el);
    await tumbler.mount();
    return;
  }

  const app = new App();
  app.init();
});
