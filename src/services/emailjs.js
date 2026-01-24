/**
 * EmailJS Service
 * Sends emails with collage attachment
 */

import emailjs from '@emailjs/browser';

// Configuration - these should be set via environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

let isInitialized = false;

/**
 * Initialize EmailJS
 */
export function initEmailJS() {
  if (!isInitialized) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    isInitialized = true;
  }
}

/**
 * Send email with collage
 * @param {string} toEmail - Recipient email address
 * @param {string} collageDataUrl - Collage image as data URL
 * @returns {Promise<void>}
 */
export async function sendCollageEmail(toEmail, collageDataUrl) {
  initEmailJS();

  // Validate configuration
  if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' ||
      EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' ||
      EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    console.warn('EmailJS is not configured. Please set environment variables.');
    throw new Error('Сервис отправки email не настроен. Обратитесь к администратору.');
  }

  const templateParams = {
    to_email: toEmail,
    reply_to: toEmail,
    message: 'Ваш коллаж готов! Спасибо за участие в нашей выставке.',
    image: collageDataUrl, // Note: EmailJS has size limits for attachments
    date: new Date().toLocaleDateString('ru-RU')
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status !== 200) {
      throw new Error('Email service returned non-200 status');
    }

    return response;
  } catch (error) {
    console.error('EmailJS error:', error);

    if (error.text?.includes('limit')) {
      throw new Error('Превышен лимит отправки писем. Попробуйте позже.');
    }

    throw new Error('Не удалось отправить письмо. Проверьте email и попробуйте еще раз.');
  }
}

/**
 * Check if EmailJS is properly configured
 * @returns {boolean}
 */
export function isEmailJSConfigured() {
  return EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
         EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
         EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
}
