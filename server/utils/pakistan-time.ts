// Pakistan Time (PKT) utilities - Asia/Karachi timezone
// All time operations in the app should use Pakistan Standard Time

export function getPakistanTime(): Date {
  // Get current time in Pakistan timezone (UTC+5) - matches client-side implementation
  const utcTime = new Date();
  const pakistanTime = new Date(utcTime.getTime() + (5 * 60 * 60 * 1000));
  return pakistanTime;
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