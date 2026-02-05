/**
 * Google Sheets Service
 * Saves collage data to Google Sheets via Apps Script Web App
 */

// Configuration - set via environment variables
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';

/**
 * Save email to Google Sheets (legacy method for backward compatibility)
 * @param {string} email - Email address to save
 * @param {Object} metadata - Additional data to save
 * @returns {Promise<void>}
 */
export async function saveEmailToSheets(email, metadata = {}) {
  // This is now a no-op, data is saved via saveCollageToSheets
  // Kept for backward compatibility
  console.log('Email will be saved via saveCollageToSheets');
}

/**
 * Save collage data to Google Sheets
 * @param {Object} data - Collage data
 * @param {number} data.collageId - Collage ID
 * @param {string} data.datetime - Date and time
 * @param {string} data.email - Primary email address
 * @param {string} data.customerType - Customer type
 * @param {string} data.collageUrl - Public URL to collage image
 * @returns {Promise<Object>} Response from Google Sheets
 */
export async function saveCollageToSheets(data) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Sheets integration not configured');
    return { success: false, error: 'Not configured' };
  }

  try {
    // Create form data for Google Apps Script
    const formData = new URLSearchParams();
    formData.append('collage_id', data.collageId || '');
    formData.append('datetime', data.datetime || new Date().toLocaleString('ru-RU'));
    formData.append('email', data.email || '');
    formData.append('customer_type', data.customerType || '');
    formData.append('collage_url', data.collageUrl || '');

    // Add API key if configured
    if (GOOGLE_SHEETS_API_KEY) {
      formData.append('api_key', GOOGLE_SHEETS_API_KEY);
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      console.log('Collage data saved to Google Sheets:', result);
      return result;
    } else {
      console.error('Failed to save to Google Sheets:', result.error);
      return result;
    }
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if Google Sheets integration is configured
 * @returns {boolean}
 */
export function isGoogleSheetsConfigured() {
  return !!GOOGLE_SCRIPT_URL;
}
