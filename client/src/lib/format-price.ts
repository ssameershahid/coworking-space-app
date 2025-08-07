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