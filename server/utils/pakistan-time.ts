// Pakistan Time (PKT) utilities - Asia/Karachi timezone
// ALL time operations in the app MUST use Pakistan Standard Time (UTC+5)
// This app ONLY works in Pakistan timezone - NO other timezones supported

export function getPakistanTime(): Date {
  // Return the current instant; use Asia/Karachi only for formatting/logging
  // Comparisons should be done on absolute timestamps (UTC under the hood)
  return new Date();
}

export function convertToPakistanTime(date: Date): Date {
  // Convert any date to Pakistan time (UTC+5)
  const pakistanTime = new Date(date.getTime() + (5 * 60 * 60 * 1000));
  return pakistanTime;
}

export function parseDateInPakistanTime(dateString: string): Date {
  // Parse the date string and ensure it's in Pakistan time context
  const date = new Date(dateString);
  return convertToPakistanTime(date);
}

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