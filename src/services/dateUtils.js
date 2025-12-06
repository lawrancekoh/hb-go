/**
 * Returns the current local date formatted as YYYY-MM-DD.
 * Handles timezone offset correctly by using local date methods.
 * @returns {string} YYYY-MM-DD
 */
export const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the current local time formatted as HH:MM.
 * @returns {string} HH:MM
 */
export const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Validates a date string.
 * Checks for:
 * 1. Correct format (YYYY-MM-DD)
 * 2. Valid date object
 * 3. Not in the future (tomorrow or later)
 * 4. Not older than 5 years
 * @param {string} dateStr
 * @returns {string|null} The valid date string or null
 */
export const validateDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // 1. Format Check
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return null;

  // 2. Valid Date Object Check
  // We use the date string directly. Even if parsed as UTC, checking for Invalid Date is what matters here.
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  // 3. Sanity Check: Future Date
  // We compare strings for simplicity and reliability with YYYY-MM-DD format
  const today = getToday();
  if (dateStr > today) {
    return null;
  }

  // 4. Sanity Check: Older than 5 years
  const fiveYearsAgoDate = new Date();
  fiveYearsAgoDate.setFullYear(fiveYearsAgoDate.getFullYear() - 5);

  const year5 = fiveYearsAgoDate.getFullYear();
  const month5 = String(fiveYearsAgoDate.getMonth() + 1).padStart(2, '0');
  const day5 = String(fiveYearsAgoDate.getDate()).padStart(2, '0');
  const fiveYearsAgoStr = `${year5}-${month5}-${day5}`;

  if (dateStr < fiveYearsAgoStr) {
    return null;
  }

  return dateStr;
};

/**
 * Validates a time string (HH:MM).
 * @param {string} timeStr
 * @returns {string|null} The valid time string or null
 */
export const validateTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;

  // Format Check
  const regex = /^\d{2}:\d{2}$/;
  if (!regex.test(timeStr)) return null;

  const [hours, minutes] = timeStr.split(':').map(Number);

  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;

  return timeStr;
};
