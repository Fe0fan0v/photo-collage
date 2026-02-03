/**
 * Success/Result Screen
 * Shows the result and allows downloading
 */

import { createElement } from '../utils/helpers.js';
import logoUrl from '../assets/logo.png';

export class SuccessScreen {
  constructor(app) {
    this.app = app;
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

    // Content with padding
    const content = createElement('div', { className: 'screen-content-padded' });

    // Collage preview
    const collageDataUrl = this.app.getCollage();

    if (collageDataUrl) {
      const preview = createElement('div', { className: 'collage-preview' });
      const img = createElement('img', {
        src: collageDataUrl,
        alt: 'Ваш портрет'
      });
      preview.appendChild(img);
      content.appendChild(preview);
    }

    const description = createElement('p', { className: 'text-center' },
      'Нажмите кнопку ниже, чтобы сохранить изображение'
    );
    content.appendChild(description);

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

    content.appendChild(buttonContainer);
    screen.appendChild(content);

    return screen;
  }

  handleTryAgain() {
    this.app.reset();
    this.app.navigateTo('camera');
  }
}
