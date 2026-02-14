/**
 * Email Form Screen
 * Collects emails and customer types for both users
 */

import { createElement, isValidEmail } from '../utils/helpers.js';
import { sendCollageToMultiple } from '../services/emailjs.js';
import logoUrl from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const CUSTOMER_TYPES = [
  'Частный покупатель',
  'Дизайнер',
  'Дилер',
  'Поставщик'
];

export class EmailFormScreen {
  constructor(app) {
    this.app = app;
    this.email1Input = null;
    this.customerType1Select = null;
    this.email2Input = null;
    this.customerType2Select = null;
    this.submitButton = null;
    this.errorText = null;
    this.isSubmitting = false;
  }

  render() {
    const screen = createElement('div', { className: 'screen screen-email-form' });

    // Logo header (gray background)
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

    // Email 1 input group (required)
    const email1Group = createElement('div', { className: 'form-group' });

    const email1Label = createElement('label', { className: 'form-label' });
    email1Label.textContent = 'Email 1*';
    email1Group.appendChild(email1Label);

    this.email1Input = createElement('input', {
      className: 'form-input',
      type: 'email',
      placeholder: 'ivanpetrov@mail.ru',
      autocomplete: 'email',
      inputmode: 'email',
      required: 'true'
    });
    email1Group.appendChild(this.email1Input);

    content.appendChild(email1Group);

    // Customer type 1 select (optional)
    const type1Group = createElement('div', { className: 'form-group' });

    const type1Label = createElement('label', { className: 'form-label' });
    type1Label.textContent = 'Вы';
    type1Group.appendChild(type1Label);

    this.customerType1Select = createElement('select', { className: 'form-select' });

    CUSTOMER_TYPES.forEach((type, index) => {
      const option = createElement('option', { value: type });
      option.textContent = type;
      if (index === 0) option.selected = true; // Default to first option
      this.customerType1Select.appendChild(option);
    });

    type1Group.appendChild(this.customerType1Select);
    content.appendChild(type1Group);

    // Email 2 input group (optional)
    const email2Group = createElement('div', { className: 'form-group' });

    const email2Label = createElement('label', { className: 'form-label' });
    email2Label.textContent = 'Email 2';
    email2Group.appendChild(email2Label);

    this.email2Input = createElement('input', {
      className: 'form-input',
      type: 'email',
      placeholder: 'ivanpetrov@mail.ru',
      autocomplete: 'email',
      inputmode: 'email'
    });
    email2Group.appendChild(this.email2Input);

    content.appendChild(email2Group);

    // Customer type 2 select (optional)
    const type2Group = createElement('div', { className: 'form-group' });

    const type2Label = createElement('label', { className: 'form-label' });
    type2Label.textContent = 'Вы';
    type2Group.appendChild(type2Label);

    this.customerType2Select = createElement('select', { className: 'form-select' });

    CUSTOMER_TYPES.forEach((type, index) => {
      const option = createElement('option', { value: type });
      option.textContent = type;
      if (index === 0) option.selected = true;
      this.customerType2Select.appendChild(option);
    });

    type2Group.appendChild(this.customerType2Select);
    content.appendChild(type2Group);

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

    screen.appendChild(content);

    return screen;
  }

  mount() {
    // Focus email input after render
    setTimeout(() => {
      this.email1Input?.focus();
    }, 100);
  }

  _fetchWithTimeout(url, options, timeoutMs = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    // Clear previous errors
    this.hideError();

    // Validate email 1 (required)
    const email1 = this.email1Input.value.trim();
    if (!email1) {
      this.showError('Пожалуйста, введите Email 1');
      this.email1Input.classList.add('error');
      return;
    }

    if (!isValidEmail(email1)) {
      this.showError('Пожалуйста, введите корректный Email 1');
      this.email1Input.classList.add('error');
      return;
    }

    // Get email 2 (optional)
    const email2 = this.email2Input.value.trim();

    // Validate email 2 if provided
    if (email2 && !isValidEmail(email2)) {
      this.showError('Пожалуйста, введите корректный Email 2');
      this.email2Input.classList.add('error');
      return;
    }

    // Get customer types
    const customerType1 = this.customerType1Select.value;
    const customerType2 = this.customerType2Select.value;

    // Start submission
    this.isSubmitting = true;
    this.submitButton.disabled = true;
    this.submitButton.textContent = 'Отправляем...';

    try {
      const collageDataUrl = this.app.getCollage();

      // Build recipients list
      const recipients = [{ email: email1, customerType: customerType1 }];
      if (email2) {
        recipients.push({ email: email2, customerType: customerType2 });
      }

      // Run save-collage and send-email in parallel (save-collage is optional)
      const savePromise = this._fetchWithTimeout(`${API_URL}/save-collage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: collageDataUrl,
          email: email1,
          customerType: customerType1
        })
      }, 90000).then(async (res) => {
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            return {
              collageId: result.collageId,
              url: result.url,
              datetime: new Date().toLocaleString('ru-RU')
            };
          }
        }
        return null;
      }).catch((err) => {
        console.error('Failed to save collage:', err);
        return null;
      });

      const emailBody = JSON.stringify({
        image: collageDataUrl,
        recipients
      });

      const emailPromise = this._fetchWithTimeout(`${API_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: emailBody
      }, 90000);

      const [collageInfo, emailResponse] = await Promise.all([savePromise, emailPromise]);

      const emailData = await emailResponse.json();
      if (!emailData.success) {
        throw new Error(emailData.message || 'Не удалось отправить письма.');
      }

      // Save emails to app state
      const emails = [{ email: email1, customerType: customerType1 }];
      if (email2) {
        emails.push({ email: email2, customerType: customerType2 });
      }
      this.app.setEmails(emails);

      // Navigate to final screen with Telegram popup
      this.app.navigateTo('final', { showTelegramPopup: true });
    } catch (error) {
      console.error('Submit error:', error);
      const msg = error.name === 'AbortError'
        ? 'Превышено время ожидания. Проверьте интернет и попробуйте ещё раз.'
        : (error.message || 'Произошла ошибка. Попробуйте еще раз.');
      this.showError(msg);
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
    this.email1Input.classList.remove('error');
    this.email2Input.classList.remove('error');
  }

  cleanup() {
    this.isSubmitting = false;
  }
}
