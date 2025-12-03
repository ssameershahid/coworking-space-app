// Pakistan Time (PKT) utilities - Asia/Karachi timezone (UTC+5)
// ALL time operations in the app use Pakistan Standard Time
// This app ONLY works in Pakistan timezone - NO other timezones supported
//
// CRITICAL: For TIME COMPARISONS (e.g., "is this booking in the past?"),
// use ABSOLUTE timestamps (Date objects) directly - they are timezone-agnostic.
// Only use these utilities for DISPLAY formatting or DATE-based filtering.

/**
 * Get current time as a Date object.
 * For time COMPARISONS, just use: new Date()
 * The Date object represents an absolute instant in time (internally UTC).
 */
export function getPakistanTime(): Date {
  return new Date();
}

/**
 * DEPRECATED - DO NOT USE FOR COMPARISONS!
 * This was buggy - adding 5 hours to a timestamp doesn't convert timezones.
 * For comparisons, use absolute timestamps directly.
 * Keeping for backwards compatibility but it now just returns the same date.
 */
export function convertToPakistanTime(date: Date): Date {
  // FIXED: Just return the date as-is. 
  // Date objects are timezone-agnostic for comparisons.
  // The old code (date.getTime() + 5 hours) was WRONG.
  return date;
}

/**
 * Parse a date string to a Date object.
 * If the string has timezone info (e.g., +05:00), it's parsed correctly.
 * If not, it's parsed as local time.
 */
export function parseDateInPakistanTime(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format a Date for DISPLAY in Pakistan timezone.
 * Use this ONLY for showing times to users, NOT for comparisons.
 */
export function formatPakistanTime(date: Date): string {
  return date.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get today's date string in Pakistan timezone (YYYY-MM-DD format).
 * Use this for DATE-based filtering (e.g., "today's orders").
 */
export function getTodayPakistanDateString(): string {
  const now = new Date();
  // Use Intl.DateTimeFormat for correct timezone conversion
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

/**
 * Convert any timestamp to a Pakistan date string (YYYY-MM-DD format).
 * Use this for DATE-based comparisons.
 */
export function toDateStringInPakistan(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Check if a timestamp is "today" in Pakistan timezone.
 */
export function isTodayInPakistan(date: Date | string): boolean {
  return getTodayPakistanDateString() === toDateStringInPakistan(date);
}

/**
 * Get current month (0-11) in Pakistan timezone.
 */
export function getCurrentMonthInPakistan(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'numeric'
  });
  return parseInt(formatter.format(new Date())) - 1;
}

/**
 * Get current year in Pakistan timezone.
 */
export function getCurrentYearInPakistan(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric'
  });
  return parseInt(formatter.format(new Date()));
}

/**
 * Check if a timestamp is in the current month (Pakistan timezone).
 */
export function isThisMonthInPakistan(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'numeric',
    year: 'numeric'
  });
  const nowParts = formatter.format(new Date());
  const dateParts = formatter.format(d);
  return nowParts === dateParts;
}