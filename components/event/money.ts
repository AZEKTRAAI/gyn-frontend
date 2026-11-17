/** A fee as the public site shows it: "$199", "$12.50", "Free". */
export function money(cents: number, currency: string): string {
  if (cents === 0) return 'Free'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)
  } catch {
    return `${currency} ${cents / 100}`
  }
}
