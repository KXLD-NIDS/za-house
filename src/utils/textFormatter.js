/**
 * Fixes encoding issues with French accented characters from the database
 * Replaces corrupted characters with proper French accents
 */
export const fixFrenchAccents = (text) => {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/Ã©/g, 'é')  // é
    .replace(/Ã¨/g, 'è')  // è
    .replace(/Ãª/g, 'ê')  // ê
    .replace(/Ã«/g, 'ë')  // ë
    .replace(/Ã /g, 'à')  // à
    .replace(/Ã¹/g, 'ù')  // ù
    .replace(/Ã¢/g, 'â')  // â
    .replace(/Ãµ/g, 'õ')  // õ
    .replace(/Ã§/g, 'ç')  // ç
    .replace(/Ã´/g, 'ô')  // ô
    .replace(/Ã/g, 'Â')   // Â
    .replace(/Â/g, '')    // Remove remaining encoding artifacts
    .trim();
};

/**
 * Fixes text in an object recursively
 */
export const fixObjectAccents = (obj) => {
  if (typeof obj === 'string') {
    return fixFrenchAccents(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(fixObjectAccents);
  }
  if (obj !== null && typeof obj === 'object') {
    const fixed = {};
    for (const key in obj) {
      fixed[key] = fixObjectAccents(obj[key]);
    }
    return fixed;
  }
  return obj;
};

/**
 * Calculates and returns how many days ago a date was modified
 * @param {string} dateStr - Date string in format "DD/MM/YYYY"
 * @returns {string} - Text like "2 days ago" or "Today"
 */
export const getDaysAgoText = (dateStr) => {
  if (!dateStr) return '';
  
  // Parse DD/MM/YYYY format
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  const modifiedDate = new Date(year, month, day);
  const today = new Date();
  
  // Set times to midnight for accurate day difference
  modifiedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffMs = today - modifiedDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};
