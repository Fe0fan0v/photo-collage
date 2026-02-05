/**
 * Plate Selection Screen
 * Allows user to choose one of 6 plate designs
 */

import { createElement } from '../utils/helpers.js';
import logoUrl from '../assets/logo.png';

// Import plate images
import plate1Url from '../assets/plate-1.png';
import plate2Url from '../assets/plate-2.png';
import plate3Url from '../assets/plate-3.png';
import plate4Url from '../assets/plate-4.png';
import plate5Url from '../assets/plate-5.png';
import plate6Url from '../assets/plate-6.png';

const PLATES = [
  { id: 0, name: 'Фон 1', url: plate1Url },
  { id: 1, name: 'Фон 2', url: plate2Url },
  { id: 2, name: 'Фон 3', url: plate3Url },
  { id: 3, name: 'Фон 4', url: plate4Url },
  { id: 4, name: 'Фон 5', url: plate5Url },
  { id: 5, name: 'Фон 6', url: plate6Url }
];

export class PlateSelectScreen {
  constructor(app) {
    this.app = app;
    this.selectedPlate = null;
    this.continueButton = null;
    this.plateItems = [];
  }

  render() {
    const screen = createElement('div', { className: 'screen screen-plate-select' });

    // Logo header
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    // Content container
    const content = createElement('div', { className: 'plate-select-content' });

    // Title
    const title = createElement('h2', { className: 'plate-select-title' });
    title.textContent = 'Выберите фон';
    content.appendChild(title);

    // Plates list (vertical scrollable)
    const platesList = createElement('div', { className: 'plates-list' });

    PLATES.forEach((plate, index) => {
      const item = createElement('div', {
        className: 'plate-item',
        onClick: () => this.selectPlate(index)
      });

      // Number badge (alternating left/right)
      const numberBadge = createElement('div', {
        className: `plate-number ${index % 2 === 0 ? 'left' : 'right'}`
      });
      numberBadge.textContent = index + 1;
      item.appendChild(numberBadge);

      // Plate image
      const plateImage = createElement('img', {
        className: 'plate-item-image',
        src: plate.url,
        alt: plate.name
      });
      item.appendChild(plateImage);

      this.plateItems.push(item);
      platesList.appendChild(item);
    });

    content.appendChild(platesList);

    // Continue button
    const buttonContainer = createElement('div', { className: 'plate-select-actions' });
    this.continueButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleContinue(),
      disabled: 'true'
    });
    this.continueButton.textContent = 'ВЫБРАТЬ ФОТКУ';

    buttonContainer.appendChild(this.continueButton);
    content.appendChild(buttonContainer);

    screen.appendChild(content);

    return screen;
  }

  selectPlate(index) {
    // Remove selection from all items
    this.plateItems.forEach(item => item.classList.remove('selected'));

    // Select the clicked item
    this.plateItems[index].classList.add('selected');
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
    this.plateItems = [];
  }
}

export { PLATES };
