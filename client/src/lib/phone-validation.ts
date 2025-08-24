/**
 * Phone number validation utility
 * Allows: numbers, +, -, (, ), spaces
 * Disallows: alphabets and other special characters
 */

export const validatePhoneNumber = (value: string): boolean => {
  // Allow empty values (optional field)
  if (!value || value.trim() === '') {
    return true;
  }
  
  // Regex to allow only numbers, +, -, (, ), spaces, and dots
  const phoneRegex = /^[\d\s\+\-\(\)\.]+$/;
  return phoneRegex.test(value);
};

export const formatPhoneNumber = (value: string): string => {
  // Remove any non-allowed characters
  return value.replace(/[^\d\s\+\-\(\)\.]/g, '');
};

export const handlePhoneInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setValue: (value: string) => void
) => {
  const input = e.target.value;
  
  // If the input contains invalid characters, format it
  if (!validatePhoneNumber(input)) {
    const formatted = formatPhoneNumber(input);
    setValue(formatted);
  } else {
    setValue(input);
  }
};
