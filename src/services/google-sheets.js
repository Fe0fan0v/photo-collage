/**
 * Google Sheets Service
 * Saves email addresses to Google Sheets via Apps Script Web App
 */

// Configuration - set via environment variable
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

/**
 * Save email to Google Sheets
 * @param {string} email - Email address to save
 * @param {Object} metadata - Additional data to save
 * @returns {Promise<void>}
 */
export async function saveEmailToSheets(email, metadata = {}) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Sheets integration not configured');
    return; // Silent fail - email saving to sheets is optional
  }

  const data = {
    email,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ...metadata
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires no-cors
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // With no-cors mode, we can't read the response
    // but we assume success if no error is thrown
    console.log('Email saved to Google Sheets');
  } catch (error) {
    // Log error but don't throw - this is a non-critical feature
    console.error('Failed to save email to Google Sheets:', error);
  }
}

/**
 * Check if Google Sheets integration is configured
 * @returns {boolean}
 */
export function isGoogleSheetsConfigured() {
  return !!GOOGLE_SCRIPT_URL;
}
