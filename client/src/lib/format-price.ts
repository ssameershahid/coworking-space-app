/**
 * Format price to show whole numbers when no decimals, otherwise show full decimal places
 * Examples: 550.00 → "550", 25.50 → "25.50", 100.75 → "100.75"
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Check if it's a whole number (no decimals)
  if (numPrice % 1 === 0) {
    return numPrice.toString();
  }
  
  // Has decimals, show them
  return numPrice.toFixed(2);
}

/**
 * Format price with Rs. prefix
 */
export function formatPriceWithCurrency(price: string | number): string {
  return `Rs. ${formatPrice(price)}`;
}

/**
 * Format large currency amounts with commas and no decimals
 * Examples: 5944229.25 → "Rs. 5,944,229", 1500 → "Rs. 1,500"
 */
export function formatLargeCurrencyAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Round to whole number and add commas
  const rounded = Math.round(numAmount);
  const formatted = rounded.toLocaleString('en-US');
  
  return `Rs. ${formatted}`;
}