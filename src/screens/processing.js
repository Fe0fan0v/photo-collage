/**
 * Processing Screen
 * Shows progress while removing backgrounds and creating collage
 */

import { createElement } from '../utils/helpers.js';
import { createCollage } from '../services/collage.js';
import logoUrl from '../assets/logo.png';

export class ProcessingScreen {
  constructor(app) {
    this.app = app;
    this.progressFill = null;
    this.statusText = null;
  }

  render() {
    const screen = createElement('div', { className: 'screen screen-processing' });

    // Logo header
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    const container = createElement('div', { className: 'processing-container' });

    // Status title
    const statusTitle = createElement('h2', { className: 'processing-title' });
    statusTitle.textContent = 'Создаем Hybrid';
    container.appendChild(statusTitle);

    // Spinner (animated preloader)
    const spinner = createElement('div', { className: 'spinner' });
    container.appendChild(spinner);

    // Status text (dynamic text showing current step)
    this.statusText = createElement('p', { className: 'processing-status' });
    this.statusText.textContent = 'Подготовка...';
    container.appendChild(this.statusText);

    screen.appendChild(container);

    return screen;
  }

  async mount() {
    try {
      await this.processPhotos();
    } catch (error) {
      console.error('Processing error:', error);
      alert(error.message || 'Произошла ошибка при обработке. Попробуйте ещё раз.');
      this.app.reset();
      this.app.navigateTo('camera');
    }
  }

  async processPhotos() {
    const photos = this.app.getPhotos();
    const plateIndex = this.app.getSelectedPlate();

    if (photos.length !== 2) {
      throw new Error('Недостаточно фотографий');
    }

    if (plateIndex === null) {
      throw new Error('Тарелка не выбрана');
    }

    const collageDataUrl = await createCollage(
      photos[0],
      photos[1],
      plateIndex,
      (progress) => {
        // Update status text based on progress
        if (progress < 5) {
          this.updateStatus('Подготовка...');
        } else if (progress < 30) {
          this.updateStatus('Обрабатываем фото 1...');
        } else if (progress < 55) {
          this.updateStatus('Обрабатываем фото 2...');
        } else if (progress < 70) {
          this.updateStatus('Загружаем фон...');
        } else if (progress < 90) {
          this.updateStatus('Создаем гибрид...');
        } else {
          this.updateStatus('Финальные штрихи...');
        }
      }
    );

    this.app.setCollage(collageDataUrl);

    this.updateProgress(100);
    this.updateStatus('Готово!');

    await new Promise(resolve => setTimeout(resolve, 500));

    this.app.navigateTo('success');
  }

  updateProgress(percent) {
    if (this.progressFill) {
      this.progressFill.style.width = `${percent}%`;
    }
  }

  updateStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }
}
