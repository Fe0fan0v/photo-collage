/**
 * Processing Screen
 * Shows progress while removing backgrounds and creating collage
 */

import { createElement } from '../utils/helpers.js';
import { createCollage } from '../services/collage.js';

export class ProcessingScreen {
  constructor(app) {
    this.app = app;
    this.progressFill = null;
    this.statusText = null;
  }

  render() {
    const screen = createElement('div', { className: 'screen' });

    const container = createElement('div', { className: 'processing-container' });

    // Spinner
    const spinner = createElement('div', { className: 'spinner' });
    container.appendChild(spinner);

    // Title
    const title = createElement('h2', {}, 'Создаём ваш портрет...');
    container.appendChild(title);

    // Status text
    this.statusText = createElement('p', {}, 'Подготовка...');
    container.appendChild(this.statusText);

    // Progress bar
    const progressBar = createElement('div', { className: 'progress-bar' });
    this.progressFill = createElement('div', {
      className: 'progress-fill',
      style: { width: '0%' }
    });
    progressBar.appendChild(this.progressFill);
    container.appendChild(progressBar);

    // Note about processing time
    const note = createElement('p', {
      style: { fontSize: '0.8rem', marginTop: '20px', opacity: '0.7' }
    }, 'Удаление фона может занять 10-30 секунд');
    container.appendChild(note);

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
        this.updateProgress(progress);

        if (progress < 5) {
          this.updateStatus('Подготовка...');
        } else if (progress < 30) {
          this.updateStatus('Удаляем фон с фото 1...');
        } else if (progress < 55) {
          this.updateStatus('Удаляем фон с фото 2...');
        } else if (progress < 70) {
          this.updateStatus('Загружаем тарелку...');
        } else if (progress < 90) {
          this.updateStatus('Собираем коллаж...');
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
