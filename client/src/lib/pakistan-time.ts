// Pakistan Time Utility Functions
// Pakistan Standard Time is GMT+5 (Asia/Karachi)
// ALL time operations in this app MUST use Pakistan Standard Time (UTC+5)
// This app ONLY works in Pakistan timezone - NO other timezones supported

export function getPakistanTime(): Date {
  // Return the current instant; use Asia/Karachi only for formatting/display
  // Comparisons should be done on absolute timestamps (UTC under the hood)
  return new Date();
}

export function getPakistanTimeString(): string {
  // Get current Pakistan time as ISO string
  return getPakistanTime().toISOString();
}

export function getPakistanDateString(): string {
  // Get current Pakistan date as YYYY-MM-DD string
  return getPakistanTime().toISOString().split('T')[0];
}

/**
 * CRITICAL: Get today's date string in Pakistan timezone (Asia/Karachi)
 * This properly handles timezone conversion using Intl.DateTimeFormat
 * Returns format: "YYYY-MM-DD"
 */
export function getTodayPakistanDateString(): string {
  const now = new Date();
  // Use Intl.DateTimeFormat to get the date parts in Pakistan timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA format gives us YYYY-MM-DD directly
  return formatter.format(now);
}

/**
 * CRITICAL: Convert a UTC timestamp to Pakistan date string
 * This properly handles timezone conversion for order timestamps
 * Returns format: "YYYY-MM-DD"
 */
export function toDateStringInPakistan(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use Intl.DateTimeFormat to get the date parts in Pakistan timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA format gives us YYYY-MM-DD directly
  return formatter.format(d);
}

/**
 * Check if a given date/timestamp is "today" in Pakistan timezone
 * This is the CORRECT way to filter for today's orders
 */
export function isTodayInPakistan(date: Date | string): boolean {
  const todayPakistan = getTodayPakistanDateString();
  const datePakistan = toDateStringInPakistan(date);
  return todayPakistan === datePakistan;
}

/**
 * Get current month (0-11) in Pakistan timezone
 */
export function getCurrentMonthInPakistan(): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'numeric'
  });
  return parseInt(formatter.format(now)) - 1; // Convert 1-12 to 0-11
}

/**
 * Get current year in Pakistan timezone
 */
export function getCurrentYearInPakistan(): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric'
  });
  return parseInt(formatter.format(now));
}

/**
 * Get month (0-11) of a timestamp in Pakistan timezone
 */
export function getMonthInPakistan(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'numeric'
  });
  return parseInt(formatter.format(d)) - 1; // Convert 1-12 to 0-11
}

/**
 * Get year of a timestamp in Pakistan timezone
 */
export function getYearInPakistan(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric'
  });
  return parseInt(formatter.format(d));
}

/**
 * Check if a timestamp is in the current month (Pakistan timezone)
 * This is the CORRECT way to filter for "this month's" orders/bookings
 */
export function isThisMonthInPakistan(date: Date | string): boolean {
  const currentMonth = getCurrentMonthInPakistan();
  const currentYear = getCurrentYearInPakistan();
  const dateMonth = getMonthInPakistan(date);
  const dateYear = getYearInPakistan(date);
  return dateMonth === currentMonth && dateYear === currentYear;
}

/**
 * Check if a timestamp is in a specific month/year (Pakistan timezone)
 * Use this for filtering by a selected month (e.g., invoice generation)
 * @param date - The date to check
 * @param month - Target month (0-11, like JavaScript Date.getMonth())
 * @param year - Target year (e.g., 2024)
 */
export function isInMonthPakistan(date: Date | string, month: number, year: number): boolean {
  const dateMonth = getMonthInPakistan(date);
  const dateYear = getYearInPakistan(date);
  return dateMonth === month && dateYear === year;
}

export function formatPakistanDate(dateOffset: number = 0): Date {
  // Get Pakistan time with optional date offset
  const pakistanTime = getPakistanTime();
  pakistanTime.setDate(pakistanTime.getDate() + dateOffset);
  return pakistanTime;
}

export function formatPakistanDateString(dateOffset: number = 0): string {
  // Get Pakistan date string with optional date offset
  const pakistanDate = formatPakistanDate(dateOffset);
  return pakistanDate.toISOString().split('T')[0];
}

export function isPastTimePakistan(dateTimeString: string): boolean {
  // Check if a given datetime string is in the past according to Pakistan time
  // The input datetime string should already be in Pakistan timezone (+05:00)
  const inputTime = new Date(dateTimeString);
  const pakistanNow = getPakistanTime();
  
  // For debugging
  console.log(`🔍 isPastTimePakistan debug:`);
  console.log(`   Input string: ${dateTimeString}`);
  console.log(`   Parsed input time: ${inputTime.toISOString()}`);
  console.log(`   Current Pakistan time: ${pakistanNow.toISOString()}`);
  console.log(`   Is past? ${inputTime < pakistanNow}`);
  console.log(`   Time difference (minutes): ${(inputTime.getTime() - pakistanNow.getTime()) / (1000 * 60)}`);
  
  return inputTime < pakistanNow;
}

export function formatPakistanTimeSlot(dateString: string, timeString: string): Date {
  // Create a Pakistan time slot from date and time strings
  const pakistanDateTime = new Date(`${dateString}T${timeString}:00+05:00`);
  return pakistanDateTime;
}