/**
 * Plate Selection Screen
 * Allows user to choose one of 3 plate designs
 */

import { createElement } from '../utils/helpers.js';

// Import plate images
import plate1Url from '../assets/plate-1.jpg';
import plate2Url from '../assets/plate-2.jpg';
import plate3Url from '../assets/plate-3.jpg';

const PLATES = [
  { id: 0, name: 'Восток и Запад', url: plate1Url },
  { id: 1, name: 'Цветочный', url: plate2Url },
  { id: 2, name: 'Классика', url: plate3Url }
];

export class PlateSelectScreen {
  constructor(app) {
    this.app = app;
    this.selectedPlate = null;
    this.continueButton = null;
    this.plateCards = [];
  }

  render() {
    const screen = createElement('div', { className: 'screen' });

    // Title
    const title = createElement('h1', { className: 'text-center' }, 'Выберите тарелку');
    screen.appendChild(title);

    const description = createElement('p', { className: 'text-center' },
      'Ваш портрет будет обрамлён выбранным дизайном'
    );
    screen.appendChild(description);

    // Plates grid
    const platesGrid = createElement('div', { className: 'plates-grid' });

    PLATES.forEach((plate, index) => {
      const card = createElement('div', {
        className: 'plate-card',
        onClick: () => this.selectPlate(index)
      });

      const img = createElement('img', {
        className: 'plate-image',
        src: plate.url,
        alt: plate.name
      });
      card.appendChild(img);

      const name = createElement('div', { className: 'plate-name' }, plate.name);
      card.appendChild(name);

      this.plateCards.push(card);
      platesGrid.appendChild(card);
    });

    screen.appendChild(platesGrid);

    // Continue button
    const buttonContainer = createElement('div', { className: 'mt-auto text-center' });
    this.continueButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleContinue(),
      disabled: 'true'
    }, 'Продолжить');

    buttonContainer.appendChild(this.continueButton);
    screen.appendChild(buttonContainer);

    return screen;
  }

  selectPlate(index) {
    // Remove selection from all cards
    this.plateCards.forEach(card => card.classList.remove('selected'));

    // Select the clicked card
    this.plateCards[index].classList.add('selected');
    this.selectedPlate = index;

    // Enable continue button
    this.continueButton.disabled = false;
  }

  handleContinue() {
    if (this.selectedPlate === null) return;

    this.app.setSelectedPlate(this.selectedPlate);
    this.app.navigateTo('processing');
  }

  cleanup() {
    this.selectedPlate = null;
    this.plateCards = [];
  }
}

export { PLATES };
