/**
 * Utility functions for URL validation and formatting
 */

/**
 * Validates and formats a URL to ensure it's properly formatted
 * @param {string} url - The URL to validate
 * @returns {string|null} - The properly formatted URL or null if invalid
 */
export const validateAndFormatUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  url = url.trim();

  // If empty after trimming, return null
  if (!url) {
    return null;
  }

  // If it already starts with http:// or https://, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // If it doesn't start with a protocol, add https://
  return `https://${url}`;
};

/**
 * Checks if a URL is valid
 * @param {string} url - The URL to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidUrl = (url) => {
  try {
    const formattedUrl = validateAndFormatUrl(url);
    if (!formattedUrl) return false;
    
    new URL(formattedUrl);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets a safe URL for use in href attributes
 * @param {string} url - The URL to process
 * @returns {string} - Safe URL or '#' if invalid
 */
export const getSafeUrl = (url) => {
  const formattedUrl = validateAndFormatUrl(url);
  return isValidUrl(formattedUrl) ? formattedUrl : '#';
};
