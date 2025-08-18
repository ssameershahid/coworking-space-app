// Pakistan Time Utility Functions
// Pakistan Standard Time is GMT+5
// ALL time operations in this app MUST use Pakistan Standard Time (UTC+5)
// This app ONLY works in Pakistan timezone - NO other timezones supported

export function getPakistanTime(): Date {
  // ALWAYS return Pakistan time (UTC+5) - this is the ONLY timezone for this app
  const utcTime = new Date();
  const pakistanTime = new Date(utcTime.getTime() + (5 * 60 * 60 * 1000));
  return pakistanTime;
}

export function getPakistanTimeString(): string {
  // Get current Pakistan time as ISO string
  return getPakistanTime().toISOString();
}

export function getPakistanDateString(): string {
  // Get current Pakistan date as YYYY-MM-DD string
  return getPakistanTime().toISOString().split('T')[0];
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