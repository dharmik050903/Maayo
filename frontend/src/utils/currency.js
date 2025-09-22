/**
 * Currency utility functions for Indian Rupee formatting
 */

/**
 * Format a number as Indian Rupee currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol (default: true)
 * @param {boolean} showDecimals - Whether to show decimal places (default: false)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showSymbol = true, showDecimals = false) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0'
  }

  const options = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }

  // Use Indian locale for proper formatting
  const formatted = new Intl.NumberFormat('en-IN', options).format(amount)
  
  // If showSymbol is false, remove the ₹ symbol
  if (!showSymbol) {
    return formatted.replace('₹', '').trim()
  }

  return formatted
}

/**
 * Format a number with Indian number system (lakhs, crores)
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol (default: true)
 * @returns {string} Formatted currency string with Indian number system
 */
export function formatCurrencyIndian(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0'
  }

  const symbol = showSymbol ? '₹' : ''
  
  if (amount >= 10000000) { // 1 crore
    return `${symbol}${(amount / 10000000).toFixed(1)} Cr`
  } else if (amount >= 100000) { // 1 lakh
    return `${symbol}${(amount / 100000).toFixed(1)} L`
  } else if (amount >= 1000) { // 1 thousand
    return `${symbol}${(amount / 1000).toFixed(1)} K`
  } else {
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }
}

/**
 * Format hourly rate with proper currency symbol
 * @param {number} rate - The hourly rate
 * @param {boolean} showSymbol - Whether to show the ₹ symbol (default: true)
 * @returns {string} Formatted hourly rate string
 */
export function formatHourlyRate(rate, showSymbol = true) {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return showSymbol ? '₹0/hr' : '0/hr'
  }

  const symbol = showSymbol ? '₹' : ''
  return `${symbol}${rate.toLocaleString('en-IN')}/hr`
}

/**
 * Format budget with proper currency symbol
 * @param {number} budget - The budget amount
 * @param {boolean} showSymbol - Whether to show the ₹ symbol (default: true)
 * @returns {string} Formatted budget string
 */
export function formatBudget(budget, showSymbol = true) {
  if (budget === null || budget === undefined || isNaN(budget)) {
    return showSymbol ? '₹0' : '0'
  }

  const symbol = showSymbol ? '₹' : ''
  return `${symbol}${budget.toLocaleString('en-IN')}`
}

/**
 * Parse currency string to number (removes ₹ symbol and commas)
 * @param {string} currencyString - The currency string to parse
 * @returns {number} Parsed number
 */
export function parseCurrency(currencyString) {
  if (!currencyString) return 0
  
  // Remove ₹ symbol, commas, and any non-numeric characters except decimal point
  const cleaned = currencyString.toString().replace(/[₹,\s]/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}
