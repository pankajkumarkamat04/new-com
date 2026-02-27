/**
 * Normalize phone for database storage: digits only, no leading zeros or country code.
 * Returns exactly 10 digits or null if invalid.
 */
export function normalizePhoneTo10Digits(phone) {
  if (phone == null || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const last10 = digits.slice(-10);
  return last10;
}
