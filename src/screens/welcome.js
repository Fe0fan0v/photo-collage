/**
 * Welcome Screen
 * Shows introduction and start button
 */

import { createElement } from '../utils/helpers.js';
import { preloadModel, isModelReady } from '../services/background-removal.js';

export class WelcomeScreen {
  constructor(app) {
    this.app = app;
    this.preloadIndicator = null;
    this.preloadProgress = null;
  }

  render() {
    const screen = createElement('div', { className: 'screen' });

    const content = createElement('div', { className: 'welcome-content' });

    // Icon
    const icon = createElement('div', { className: 'welcome-icon' });
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="10" r="3"/>
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
      </svg>
    `;
    content.appendChild(icon);

    // Title
    const title = createElement('h1', {}, 'Портрет на тарелке');
    content.appendChild(title);

    // Description
    const description = createElement('p', {},
      'Создайте уникальный арт-портрет! Два человека делают фото, и мы соединяем их лица на декоративной тарелке.'
    );
    content.appendChild(description);

    // Steps
    const steps = createElement('div', { className: 'welcome-steps' });

    const stepsData = [
      'Первый человек фотографирует левую половину лица',
      'Второй человек фотографирует правую половину лица',
      'Выберите дизайн тарелки',
      'Получите результат на email'
    ];

    stepsData.forEach((text, index) => {
      const step = createElement('div', { className: 'welcome-step' });
      const number = createElement('span', { className: 'step-number' }, String(index + 1));
      const stepText = createElement('span', { className: 'step-text' }, text);
      step.appendChild(number);
      step.appendChild(stepText);
      steps.appendChild(step);
    });

    content.appendChild(steps);

    // Preload indicator (hidden when model is ready)
    this.preloadIndicator = createElement('div', {
      className: 'preload-indicator',
      style: {
        fontSize: '0.8rem',
        opacity: '0.7',
        marginTop: '15px',
        textAlign: 'center'
      }
    });

    const preloadText = createElement('span', {}, 'Загрузка AI модели: ');
    this.preloadProgress = createElement('span', {}, '0%');
    this.preloadIndicator.appendChild(preloadText);
    this.preloadIndicator.appendChild(this.preloadProgress);

    if (isModelReady()) {
      this.preloadIndicator.style.display = 'none';
    }

    content.appendChild(this.preloadIndicator);
    screen.appendChild(content);

    // Start button
    const buttonContainer = createElement('div', { className: 'mt-auto text-center' });
    const startButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleStart()
    }, 'Начать');

    buttonContainer.appendChild(startButton);
    screen.appendChild(buttonContainer);

    return screen;
  }

  mount() {
    // Start preloading background removal model
    preloadModel((progress) => {
      if (this.preloadProgress) {
        this.preloadProgress.textContent = `${progress}%`;
      }
      if (progress >= 100 && this.preloadIndicator) {
        this.preloadIndicator.innerHTML = 'AI модель готова!';
        setTimeout(() => {
          if (this.preloadIndicator) {
            this.preloadIndicator.style.display = 'none';
          }
        }, 1500);
      }
    });
  }

  handleStart() {
    this.app.navigateTo('camera');
  }
}
