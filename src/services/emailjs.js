/**
 * Email Service
 * Sends emails with collage via backend SMTP
 */

const API_BASE = '/api';

/**
 * Send email with collage to a single recipient
 * @param {string} toEmail - Recipient email address
 * @param {string} collageDataUrl - Collage image as data URL
 * @param {string} customerType - Customer type (optional)
 * @returns {Promise<void>}
 */
export async function sendCollageEmail(toEmail, collageDataUrl, customerType = '') {
  const response = await fetch(`${API_BASE}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: collageDataUrl,
      recipients: [{ email: toEmail, customerType }]
    })
  });

  const data = await response.json();

  if (!data.success) {
    const firstResult = data.results?.[0];
    throw new Error(firstResult?.message || data.message || 'Не удалось отправить письмо.');
  }

  return data;
}

/**
 * Send collage email to multiple recipients in a single request
 * @param {Array<{email: string, customerType: string}>} recipients
 * @param {string} collageDataUrl - Collage image as data URL
 * @returns {Promise<Object>}
 */
export async function sendCollageToMultiple(recipients, collageDataUrl) {
  const response = await fetch(`${API_BASE}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: collageDataUrl,
      recipients
    })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Не удалось отправить письма.');
  }

  return data;
}

/**
 * Check if email service is configured (backward compatibility)
 * @returns {boolean}
 */
export function isEmailJSConfigured() {
  return true;
}
