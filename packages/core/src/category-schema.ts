// What the team can edit on a registration category. Pure (no database), so the admin form and the server share it.
// The form works in strings (what a text box gives you); parsing turns the fee into cents, the seat limit into a number
// or null, and an empty date into null.
import { z } from 'zod'

/** Small on purpose: payments (phase 7) decide what the gateways accept. All of these have two decimals. */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'MYR', 'AED', 'THB'] as const
export const APPROVAL_MODES = ['AUTOMATIC', 'MANUAL_REVIEW'] as const

const FEE = /^\d{1,6}(\.\d{1,2})?$/ // up to 999999.99, well inside the integer column

/** "150" or "12.5" to cents, or null when it is not a plain amount. Integer maths only, so 0.1 + 0.2 problems cannot happen. */
export function feeToCents(input: string): number | null {
  const s = input.trim()
  if (!FEE.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

export const centsToFee = (cents: number): string => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`

const realDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s)
const day = z.string().trim().refine((s) => s === '' || realDay(s), 'Enter a real date like 2027-03-14, or leave it empty.')

export const categoryFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter a name of at least 2 characters.').max(80, 'Use at most 80 characters.'),
    slug: z
      .string()
      .trim()
      .min(2, 'Enter an address of at least 2 characters.')
      .max(60, 'Use at most 60 characters.')
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case letters, numbers and single dashes, e.g. forum-access.'),
    description: z.string().trim().max(500, 'Use at most 500 characters.'),
    fee: z.string().trim().refine((s) => feeToCents(s) !== null, 'Enter an amount like 150 or 150.00 (numbers only). Use 0 for free.'),
    currency: z.enum(CURRENCIES, 'Choose a currency from the list.'),
    approvalMode: z.enum(APPROVAL_MODES, 'Choose how applications are decided.'),
    seatLimit: z.string().trim().regex(/^([1-9]\d{0,5})?$/, 'Enter a whole number above 0, or leave empty for unlimited.'),
    active: z.boolean(),
    opensAt: day,
    closesAt: day,
  })
  .superRefine((v, ctx) => {
    if (v.opensAt && v.closesAt && realDay(v.opensAt) && realDay(v.closesAt) && v.closesAt < v.opensAt) {
      ctx.addIssue({ code: 'custom', path: ['closesAt'], message: 'The last day to register cannot be before the first day.' })
    }
  })
  .transform((v) => ({
    name: v.name,
    slug: v.slug,
    description: v.description,
    feeCents: feeToCents(v.fee)!,
    currency: v.currency,
    approvalMode: v.approvalMode,
    seatLimit: v.seatLimit ? Number(v.seatLimit) : null,
    active: v.active,
    opensAt: v.opensAt || null,
    closesAt: v.closesAt || null,
  }))

export type CategoryFormValues = {
  name: string
  slug: string
  description: string
  /** Decimal amount, e.g. "150.00". */
  fee: string
  currency: string
  approvalMode: string
  /** Empty = unlimited. */
  seatLimit: string
  active: boolean
  /** YYYY-MM-DD in the event's time zone, or empty. */
  opensAt: string
  closesAt: string
}
export type CategoryData = z.output<typeof categoryFormSchema>

export const blankCategory: CategoryFormValues = {
  name: '', slug: '', description: '', fee: '0.00', currency: 'USD', approvalMode: 'AUTOMATIC', seatLimit: '', active: true, opensAt: '', closesAt: '',
}
