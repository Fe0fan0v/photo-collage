/**
 * Email Form Screen
 * Shows collage preview and email input form
 */

import { createElement, isValidEmail } from '../utils/helpers.js';
import { sendCollageEmail } from '../services/emailjs.js';
import { saveEmailToSheets } from '../services/google-sheets.js';

export class EmailFormScreen {
  constructor(app) {
    this.app = app;
    this.emailInput = null;
    this.checkbox = null;
    this.submitButton = null;
    this.errorText = null;
    this.isSubmitting = false;
  }

  render() {
    const screen = createElement('div', { className: 'screen' });

    // Collage preview
    const preview = createElement('div', { className: 'collage-preview' });
    const collageDataUrl = this.app.getCollage();

    if (collageDataUrl) {
      const img = createElement('img', {
        src: collageDataUrl,
        alt: 'Ваш коллаж'
      });
      preview.appendChild(img);
    }
    screen.appendChild(preview);

    // Title
    const title = createElement('h2', { className: 'text-center' }, 'Ваш портрет готов!');
    screen.appendChild(title);

    const description = createElement('p', { className: 'text-center' },
      'Введите email, чтобы получить изображение'
    );
    screen.appendChild(description);

    // Form
    const form = createElement('div', { className: 'form-group' });

    // Email input
    this.emailInput = createElement('input', {
      className: 'form-input',
      type: 'email',
      placeholder: 'example@email.com',
      autocomplete: 'email',
      inputmode: 'email'
    });
    form.appendChild(this.emailInput);

    // Error text
    this.errorText = createElement('div', { className: 'form-error hidden' });
    form.appendChild(this.errorText);

    screen.appendChild(form);

    // Consent checkbox
    const checkboxGroup = createElement('label', { className: 'checkbox-group mb-20' });
    this.checkbox = createElement('input', {
      className: 'checkbox-input',
      type: 'checkbox'
    });
    checkboxGroup.appendChild(this.checkbox);

    const checkboxLabel = createElement('span', { className: 'checkbox-label' },
      'Я согласен на обработку персональных данных и получение письма с фотографией'
    );
    checkboxGroup.appendChild(checkboxLabel);
    screen.appendChild(checkboxGroup);

    // Submit button
    const buttonContainer = createElement('div', { className: 'mt-auto text-center' });
    this.submitButton = createElement('button', {
      className: 'btn btn-primary',
      onClick: () => this.handleSubmit()
    }, 'Получить фото');

    buttonContainer.appendChild(this.submitButton);
    screen.appendChild(buttonContainer);

    // Add download link as backup
    const downloadContainer = createElement('div', {
      className: 'text-center',
      style: { marginTop: '16px' }
    });

    const downloadLink = createElement('a', {
      href: collageDataUrl,
      download: 'portrait-plate.jpg',
      style: { color: 'var(--text-muted)', fontSize: '0.9rem' }
    }, 'Или скачать напрямую');

    downloadContainer.appendChild(downloadLink);
    screen.appendChild(downloadContainer);

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

    // Validate consent
    if (!this.checkbox.checked) {
      this.showError('Пожалуйста, дайте согласие на обработку данных');
      return;
    }

    // Start submission
    this.isSubmitting = true;
    this.submitButton.disabled = true;
    this.submitButton.textContent = 'Отправляем...';

    try {
      const collageDataUrl = this.app.getCollage();

      // Send email and save to sheets in parallel
      await Promise.all([
        sendCollageEmail(email, collageDataUrl),
        saveEmailToSheets(email)
      ]);

      // Save email to app state
      this.app.setEmail(email);

      // Navigate to success screen
      this.app.navigateTo('success');
    } catch (error) {
      console.error('Submit error:', error);
      this.showError(error.message || 'Произошла ошибка. Попробуйте еще раз.');
      this.isSubmitting = false;
      this.submitButton.disabled = false;
      this.submitButton.textContent = 'Получить фото';
    }
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorText.classList.remove('hidden');
  }

  hideError() {
    this.errorText.classList.add('hidden');
    this.emailInput.classList.remove('error');
  }
}
