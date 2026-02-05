/**
 * Email Form Screen
 * Collects email and customer type for sending collage
 */

import { createElement, isValidEmail } from '../utils/helpers.js';
import { sendCollageEmail } from '../services/emailjs.js';
import { saveEmailToSheets } from '../services/google-sheets.js';
import logoUrl from '../assets/logo.png';

const CUSTOMER_TYPES = [
  'Частный покупатель',
  'Дизайнер',
  'Дилер',
  'Поставщик'
];

export class EmailFormScreen {
  constructor(app) {
    this.app = app;
    this.emailInput = null;
    this.customerTypeSelect = null;
    this.submitButton = null;
    this.errorText = null;
    this.isSubmitting = false;
  }

  render() {
    const screen = createElement('div', { className: 'screen screen-email-form' });

    // Logo header
    const header = createElement('div', { className: 'logo-header' });
    const logo = createElement('img', {
      className: 'logo-image',
      src: logoUrl,
      alt: 'SELETTI × DELIGHT'
    });
    header.appendChild(logo);
    screen.appendChild(header);

    // Close button (return to success screen)
    const closeButton = createElement('button', {
      className: 'close-button',
      onClick: () => this.handleClose()
    });
    closeButton.innerHTML = '×';
    screen.appendChild(closeButton);

    // Content
    const content = createElement('div', { className: 'email-form-content' });

    // Email input group
    const emailGroup = createElement('div', { className: 'form-group' });

    const emailLabel = createElement('label', { className: 'form-label' });
    emailLabel.textContent = 'Email*';
    emailGroup.appendChild(emailLabel);

    this.emailInput = createElement('input', {
      className: 'form-input',
      type: 'email',
      placeholder: 'h.apretion@mail.ru',
      autocomplete: 'email',
      inputmode: 'email',
      required: 'true'
    });
    emailGroup.appendChild(this.emailInput);

    content.appendChild(emailGroup);

    // Customer type select (optional)
    const typeGroup = createElement('div', { className: 'form-group' });

    const typeLabel = createElement('label', { className: 'form-label' });
    typeLabel.textContent = 'Вы';
    typeGroup.appendChild(typeLabel);

    this.customerTypeSelect = createElement('select', { className: 'form-select' });

    CUSTOMER_TYPES.forEach((type, index) => {
      const option = createElement('option', { value: type });
      option.textContent = type;
      if (index === 0) option.selected = true; // Default to first option
      this.customerTypeSelect.appendChild(option);
    });

    typeGroup.appendChild(this.customerTypeSelect);
    content.appendChild(typeGroup);

    // Error text
    this.errorText = createElement('div', { className: 'form-error hidden' });
    content.appendChild(this.errorText);

    // Submit button
    const submitContainer = createElement('div', { className: 'email-form-actions' });
    this.submitButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleSubmit()
    });
    this.submitButton.textContent = 'ОТПРАВИТЬ';
    submitContainer.appendChild(this.submitButton);
    content.appendChild(submitContainer);

    // Inactive buttons (dimmed)
    const inactiveActions = createElement('div', { className: 'email-form-inactive-actions' });

    const emailButtonDimmed = createElement('button', {
      className: 'btn btn-dimmed',
      disabled: 'true'
    });
    emailButtonDimmed.textContent = 'ОТПРАВИТЬ НА ПОЧТУ\nВ ХОРОШЕМ КАЧЕСТВЕ';
    inactiveActions.appendChild(emailButtonDimmed);

    const printButtonDimmed = createElement('button', {
      className: 'btn btn-dimmed',
      disabled: 'true'
    });
    printButtonDimmed.textContent = 'РАСПЕЧАТАТЬ\nУ МЕНЕДЖЕРА СТЕНДА';
    inactiveActions.appendChild(printButtonDimmed);

    const restartButtonDimmed = createElement('button', {
      className: 'btn btn-restart btn-dimmed',
      disabled: 'true'
    });
    restartButtonDimmed.textContent = 'НАЧАТЬ СНАЧАЛА';
    inactiveActions.appendChild(restartButtonDimmed);

    content.appendChild(inactiveActions);

    screen.appendChild(content);

    return screen;
  }

  mount() {
    // Focus email input after render
    setTimeout(() => {
      this.emailInput?.focus();
    }, 100);
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    // Clear previous errors
    this.hideError();

    // Validate email
    const email = this.emailInput.value.trim();
    if (!email) {
      this.showError('Пожалуйста, введите email');
      this.emailInput.classList.add('error');
      return;
    }

    if (!isValidEmail(email)) {
      this.showError('Пожалуйста, введите корректный email');
      this.emailInput.classList.add('error');
      return;
    }

    // Get customer type (optional)
    const customerType = this.customerTypeSelect.value;

    // Start submission
    this.isSubmitting = true;
    this.submitButton.disabled = true;
    this.submitButton.textContent = 'Отправляем...';

    try {
      const collageDataUrl = this.app.getCollage();

      // Send email and save to sheets in parallel
      await Promise.all([
        sendCollageEmail(email, collageDataUrl, customerType),
        saveEmailToSheets(email, { customerType })
      ]);

      // Save email to app state
      this.app.setEmail(email);

      // Navigate back to success screen and show confirmation
      this.app.navigateTo('success', { showConfirmation: true });
    } catch (error) {
      console.error('Submit error:', error);
      this.showError(error.message || 'Произошла ошибка. Попробуйте еще раз.');
      this.isSubmitting = false;
      this.submitButton.disabled = false;
      this.submitButton.textContent = 'ОТПРАВИТЬ';
    }
  }

  handleClose() {
    // Return to success screen without sending email
    this.app.navigateTo('success');
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorText.classList.remove('hidden');
  }

  hideError() {
    this.errorText.classList.add('hidden');
    this.emailInput.classList.remove('error');
  }

  cleanup() {
    this.isSubmitting = false;
  }
}
