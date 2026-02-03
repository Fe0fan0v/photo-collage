/**
 * Welcome Screen
 * Shows introduction and start button
 */

import { createElement } from '../utils/helpers.js';
import { preloadModel } from '../services/background-removal.js';
import logoUrl from '../assets/logo.png';

export class WelcomeScreen {
  constructor(app) {
    this.app = app;
    this.warningElement = null;
  }

  render() {
    const screen = createElement('div', { className: 'screen' });

    // Logo header
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    // Content wrapper with padding
    const contentWrapper = createElement('div', { className: 'screen-content-padded' });

    // Backend warning (hidden by default)
    this.warningElement = createElement('div', {
      className: 'error-message hidden',
      style: { marginBottom: '16px' }
    });
    contentWrapper.appendChild(this.warningElement);

    const content = createElement('div', { className: 'welcome-content' });

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
    contentWrapper.appendChild(content);

    // Start button
    const buttonContainer = createElement('div', { className: 'mt-auto text-center' });
    const startButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleStart()
    }, 'Начать');

    buttonContainer.appendChild(startButton);
    contentWrapper.appendChild(buttonContainer);

    screen.appendChild(contentWrapper);

    return screen;
  }

  async mount() {
    // Check API health and show warning if not available
    const apiAvailable = await preloadModel();
    if (!apiAvailable) {
      this.showWarning('⚠️ Backend сервер не отвечает. Убедитесь, что Python backend запущен на порту 3008.');
    }
  }

  showWarning(message) {
    if (this.warningElement) {
      this.warningElement.textContent = message;
      this.warningElement.classList.remove('hidden');
    }
  }

  handleStart() {
    this.app.navigateTo('camera');
  }
}
