/**
 * Success/Result Screen
 * Shows the result and allows downloading
 */

import { createElement } from '../utils/helpers.js';

export class SuccessScreen {
  constructor(app) {
    this.app = app;
  }

  render() {
    const screen = createElement('div', { className: 'screen' });

    // Collage preview
    const collageDataUrl = this.app.getCollage();

    if (collageDataUrl) {
      const preview = createElement('div', { className: 'collage-preview' });
      const img = createElement('img', {
        src: collageDataUrl,
        alt: 'Ваш портрет'
      });
      preview.appendChild(img);
      screen.appendChild(preview);
    }

    // Title
    const title = createElement('h1', { className: 'text-center' }, 'Ваш портрет готов!');
    screen.appendChild(title);

    const description = createElement('p', { className: 'text-center' },
      'Нажмите кнопку ниже, чтобы сохранить изображение'
    );
    screen.appendChild(description);

    // Buttons
    const buttonContainer = createElement('div', {
      className: 'mt-auto text-center',
      style: { display: 'flex', flexDirection: 'column', gap: '12px' }
    });

    // Download button (primary action)
    if (collageDataUrl) {
      const downloadLink = createElement('a', {
        className: 'btn btn-primary',
        href: collageDataUrl,
        download: 'portrait-plate.jpg'
      }, 'Скачать изображение');
      buttonContainer.appendChild(downloadLink);
    }

    // Try again button
    const tryAgainButton = createElement('button', {
      className: 'btn btn-secondary',
      onClick: () => this.handleTryAgain()
    }, 'Сделать ещё портрет');
    buttonContainer.appendChild(tryAgainButton);

    screen.appendChild(buttonContainer);

    return screen;
  }

  handleTryAgain() {
    this.app.reset();
    this.app.navigateTo('welcome');
  }
}
