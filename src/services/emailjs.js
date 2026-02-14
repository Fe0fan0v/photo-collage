/**
 * Email Service
 * Sends emails with collage via backend SMTP
 */

const API_BASE = '/api';

function fetchWithTimeout(url, options, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Send email with collage to a single recipient
 * @param {string} toEmail - Recipient email address
 * @param {string} collageDataUrl - Collage image as data URL
 * @param {string} customerType - Customer type (optional)
 * @param {Object} collageInfo - Collage info for manager notification (optional)
 * @returns {Promise<void>}
 */
export async function sendCollageEmail(toEmail, collageDataUrl, customerType = '', collageInfo = null) {
  const body = {
    image: collageDataUrl,
    recipients: [{ email: toEmail, customerType }]
  };
  if (collageInfo) body.collageInfo = collageInfo;

  const response = await fetchWithTimeout(`${API_BASE}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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
 * @param {Object} collageInfo - Collage info for manager notification (optional)
 * @returns {Promise<Object>}
 */
export async function sendCollageToMultiple(recipients, collageDataUrl, collageInfo = null) {
  const body = {
    image: collageDataUrl,
    recipients
  };
  if (collageInfo) body.collageInfo = collageInfo;

  const response = await fetchWithTimeout(`${API_BASE}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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
