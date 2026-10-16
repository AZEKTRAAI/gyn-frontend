'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Script from 'next/script'
import Link from 'next/link'
import {
  TICKETS,
  attendeeSchema,
  invitationSchema,
  GENDERS,
  HEARD_FROM,
  type TicketId,
} from '@/features/registration/schema'
import { COUNTRIES } from './countries'

// ── Types ──────────────────────────────────────────────────────────────────
type AttendeeFields = z.infer<typeof attendeeSchema>
type InvitationFields = z.infer<typeof invitationSchema>

// Cast once — errors are always {message?: string}; union field names are safe
type AnyErrors = Record<string, { message?: string } | undefined>

export interface RegistrationFormProps {
  ticket: TicketId
  /** What's included — from events.json, passed by parent server component */
  includes: string[]
}

// ── localStorage helpers ───────────────────────────────────────────────────
function lsKey(ticket: TicketId) { return `sism-reg-${ticket}` }

function lsSave(ticket: TicketId, data: Record<string, unknown>) {
  try {
    const safe = { ...data }
    delete safe.passportNumber // never persist passport
    localStorage.setItem(lsKey(ticket), JSON.stringify(safe))
  } catch { /* quota / private browsing */ }
}

function lsLoad(ticket: TicketId): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(lsKey(ticket))
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
  } catch { return null }
}

function lsClear(ticket: TicketId) {
  try { localStorage.removeItem(lsKey(ticket)) } catch { /* ignore */ }
}

// ── Shared field wrapper ───────────────────────────────────────────────────
interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

function Field({ id, label, error, hint, required, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy-900)' }}>
        {label}
        {required && <span aria-hidden="true" style={{ color: 'var(--crimson-600)', marginLeft: '0.125rem' }}>*</span>}
      </label>
      {hint && <p id={`${id}-hint`} style={{ fontSize: '0.8125rem', color: 'var(--n-600)' }}>{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" style={{ fontSize: '0.8125rem', color: 'var(--crimson-600)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

const inputS: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.75rem',
  border: '1.5px solid var(--n-200)', background: 'var(--white)',
  fontSize: '1rem', fontFamily: 'var(--fb)', color: 'var(--navy-900)',
  minHeight: '44px', outline: 'none',
}
const inputE: React.CSSProperties = { ...inputS, borderColor: 'var(--crimson-600)' }
const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer' }
const selectE: React.CSSProperties = { ...inputE, cursor: 'pointer' }

// ── Progress indicator ─────────────────────────────────────────────────────
const STEPS = ['Your details', 'Review'] as const

function ProgressBar({ step }: { step: number }) {
  return (
    <nav aria-label="Registration steps" style={{ marginBottom: '2rem' }}>
      <ol style={{ display: 'flex', gap: 0, listStyle: 'none' }}>
        {STEPS.map((label, i) => (
          <li key={label} style={{ flex: 1, borderBottom: `3px solid ${i <= step ? 'var(--blue-deep)' : 'var(--n-200)'}`, paddingBottom: '0.5rem' }}>
            <span
              style={{ display: 'block', fontSize: '0.75rem', fontWeight: i === step ? 700 : 400, color: i <= step ? 'var(--blue-deep)' : 'var(--n-400)' }}
              aria-current={i === step ? 'step' : undefined}
            >
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ── Main form ──────────────────────────────────────────────────────────────
export function RegistrationForm({ ticket, includes }: RegistrationFormProps) {
  const ticketInfo = TICKETS[ticket]
  const isInvitation = ticketInfo.form === 'invitation'

  const [step, setStep] = useState(0)
  const [savedNote, setSavedNote] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [consent, setConsent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>()

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  // Attendee form
  const attendeeForm = useForm<AttendeeFields>({
    resolver: zodResolver(attendeeSchema),
    mode: 'onTouched',
  })
  // Invitation form
  const invitationForm = useForm<InvitationFields>({
    resolver: zodResolver(invitationSchema),
    mode: 'onTouched',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- union form; both shapes share the same methods
  const { register, handleSubmit, setValue, getValues, watch, setError, formState: { errors } } =
    (isInvitation ? invitationForm : attendeeForm) as unknown as ReturnType<typeof useForm>

  const errs = errors as AnyErrors

  // Restore from localStorage
  useEffect(() => {
    const saved = lsLoad(ticket)
    if (!saved) return
    Object.entries(saved).forEach(([k, v]) => {
      if (v !== undefined) setValue(k, v)
    })
    setSavedNote(true)
  }, [ticket, setValue])

  // Auto-save on changes (debounced 600ms)
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchAll = watch()
  useEffect(() => {
    const id = setTimeout(() => lsSave(ticket, getValues() as Record<string, unknown>), 600)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchAll)])

  // Turnstile callback
  useEffect(() => {
    if (!turnstileSiteKey) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Turnstile global callback
    ;(window as any).__turnstileCb = (t: string) => setTurnstileToken(t)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => { delete (window as any).__turnstileCb }
  }, [turnstileSiteKey])

  const goToReview = useCallback(() => {
    setStep(1)
    window.scrollTo({ top: 0 })
  }, [])

  const pay = useCallback(async () => {
    if (!consent) {
      setServerError('You need to agree to the Terms and Conditions to continue.')
      return
    }
    if (turnstileSiteKey && !turnstileToken) {
      setServerError('Please complete the security check.')
      return
    }
    setSubmitting(true)
    setServerError(null)
    const details = getValues()
    const payload = {
      ticket,
      details,
      consent: true as const,
      ...(turnstileToken ? { turnstileToken } : {}),
    }
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const { checkoutUrl } = (await res.json()) as { checkoutUrl: string }
        // Validate before redirect: only allow Stripe Checkout or same-origin URLs (SEC-008)
        const isSafe =
          checkoutUrl.startsWith('https://checkout.stripe.com/') ||
          checkoutUrl.startsWith(window.location.origin + '/')
        if (!isSafe) {
          console.error('registration: unexpected redirect URL rejected', checkoutUrl)
          return
        }
        lsClear(ticket)
        window.location.href = checkoutUrl
        return
      }
      if (res.status === 400) {
        const { fieldErrors } = (await res.json()) as { fieldErrors: Record<string, string[]> }
        Object.entries(fieldErrors).forEach(([path, msgs]) => {
          setError(path.replace('details.', '') as never, { message: msgs[0] })
        })
        setStep(0)
        window.scrollTo({ top: 0 })
        setTimeout(() => {
          const el = document.querySelector('[aria-invalid="true"]') as HTMLElement | null
          el?.focus()
        }, 50)
        return
      }
      if (res.status === 409) {
        setServerError('This registration is no longer available. Please email contact@thegyn.org if you have questions.')
        return
      }
      if (res.status === 429) {
        setServerError('Too many requests. Please wait a few minutes and try again.')
        return
      }
      let msg = 'Something went wrong. Please try again or email contact@thegyn.org.'
      try {
        const body = (await res.json()) as { error?: string }
        if (body.error) msg = body.error
      } catch { /* non-JSON */ }
      setServerError(msg)
    } catch {
      setServerError('Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }, [consent, ticket, getValues, turnstileToken, turnstileSiteKey, setError])

  const price = ticketInfo.amountCents / 100

  return (
    <div>
      {/* Honeypot — hidden from real users; bots fill it */}
      <input
        type="text" name="website" tabIndex={-1} aria-hidden="true" autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
      />

      <ProgressBar step={step} />

      {savedNote && (
        <div role="status" style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--n-100)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <span>We saved your progress from a previous visit.</span>
          <button type="button" onClick={() => { lsClear(ticket); setSavedNote(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--crimson-600)', fontWeight: 600 }}>
            Clear
          </button>
        </div>
      )}

      {serverError && (
        <div role="alert" aria-live="assertive" style={{ padding: '0.875rem 1rem', background: '#FFF0F0', border: '1px solid var(--crimson-600)', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--crimson-600)' }}>
          {serverError}
        </div>
      )}

      {/* ── Step 0: Your details ── */}
      {step === 0 && (
        <form
          onSubmit={handleSubmit(goToReview, () => {
            setTimeout(() => { const el = document.querySelector('[aria-invalid="true"]') as HTMLElement | null; el?.focus() }, 50)
          })}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <Field id="reg-fullName" label="Full name" error={errs.fullName?.message} required>
            <input id="reg-fullName" type="text" autoComplete="name" aria-invalid={!!errs.fullName} aria-describedby={errs.fullName ? 'reg-fullName-err' : undefined} style={errs.fullName ? inputE : inputS} {...register('fullName')} />
          </Field>

          <Field id="reg-email" label="Email address" error={errs.email?.message} required>
            <input id="reg-email" type="email" autoComplete="email" aria-invalid={!!errs.email} aria-describedby={errs.email ? 'reg-email-err' : undefined} style={errs.email ? inputE : inputS} {...register('email')} />
          </Field>

          {isInvitation ? (
            <>
              <Field id="reg-contactNumber" label="Contact number" hint="Include country code, e.g. +60 12 345 6789" error={errs.contactNumber?.message} required>
                <input id="reg-contactNumber" type="tel" autoComplete="tel" aria-invalid={!!errs.contactNumber} aria-describedby={`reg-contactNumber-hint${errs.contactNumber ? ' reg-contactNumber-err' : ''}`} style={errs.contactNumber ? inputE : inputS} {...register('contactNumber' as never)} />
              </Field>

              <Field id="reg-passportNumber" label="Passport number" hint="6 to 12 letters and digits (e.g. A12345678). Not stored after your letter is issued." error={errs.passportNumber?.message} required>
                <input id="reg-passportNumber" type="text" autoComplete="off" aria-invalid={!!errs.passportNumber} aria-describedby={`reg-passportNumber-hint${errs.passportNumber ? ' reg-passportNumber-err' : ''}`} style={errs.passportNumber ? inputE : inputS} {...register('passportNumber' as never)} />
              </Field>

              <Field id="reg-nationality" label="Nationality" error={errs.nationality?.message} required>
                <select id="reg-nationality" aria-invalid={!!errs.nationality} aria-describedby={errs.nationality ? 'reg-nationality-err' : undefined} style={errs.nationality ? selectE : selectS} {...register('nationality')}>
                  <option value="">Choose a country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field id="reg-nationality" label="Nationality" error={errs.nationality?.message} required>
                <select id="reg-nationality" aria-invalid={!!errs.nationality} aria-describedby={errs.nationality ? 'reg-nationality-err' : undefined} style={errs.nationality ? selectE : selectS} {...register('nationality')}>
                  <option value="">Choose a country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field id="reg-countryOfResidence" label="Country of residence" error={errs.countryOfResidence?.message} required>
                <select id="reg-countryOfResidence" aria-invalid={!!errs.countryOfResidence} aria-describedby={errs.countryOfResidence ? 'reg-countryOfResidence-err' : undefined} style={errs.countryOfResidence ? selectE : selectS} {...register('countryOfResidence' as never)}>
                  <option value="">Choose a country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field id="reg-whatsapp" label="WhatsApp number" hint="Include country code, e.g. +60 12 345 6789" error={errs.whatsapp?.message} required>
                <input id="reg-whatsapp" type="tel" autoComplete="tel" aria-invalid={!!errs.whatsapp} aria-describedby={`reg-whatsapp-hint${errs.whatsapp ? ' reg-whatsapp-err' : ''}`} style={errs.whatsapp ? inputE : inputS} {...register('whatsapp' as never)} />
              </Field>

              <Field id="reg-gender" label="Gender" error={errs.gender?.message} required>
                <select id="reg-gender" aria-invalid={!!errs.gender} aria-describedby={errs.gender ? 'reg-gender-err' : undefined} style={errs.gender ? selectE : selectS} {...register('gender' as never)}>
                  <option value="">Choose an option</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              <Field id="reg-heardFrom" label="How did you hear about this event?">
                <select id="reg-heardFrom" style={selectS} {...register('heardFrom' as never)}>
                  <option value="">Select one (optional)</option>
                  {HEARD_FROM.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
            </>
          )}

          <button type="submit" className="btn btn-n" style={{ alignSelf: 'flex-start', minHeight: '44px' }}>
            Continue to review
          </button>
        </form>
      )}

      {/* ── Step 1: Review ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ border: '1px solid var(--n-200)', padding: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--fd)', fontSize: '0.875rem', color: 'var(--blue-deep)', marginBottom: '0.5rem' }}>{ticketInfo.name}</p>
            <p style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(2rem,4vw,2.5rem)', lineHeight: 1, color: 'var(--navy-900)', marginBottom: '1rem' }}>${price} USD</p>
            {includes.length > 0 && (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {includes.map(item => (
                  <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--n-700)', paddingLeft: '1rem', position: 'relative' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.45em', width: '6px', height: '6px', background: 'var(--blue-ocean)', display: 'block' }} />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ background: 'var(--n-100)', padding: '1rem 1.25rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--navy-900)' }}>Your details</p>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              {Object.entries(getValues() as Record<string, unknown>).filter(([k, v]) => k !== 'passportNumber' && v).map(([k, v]) => (
                <div key={k}>
                  <dt style={{ color: 'var(--n-500)' }}>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                  <dd style={{ color: 'var(--navy-900)', fontWeight: 500 }}>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--n-600)', lineHeight: 1.6 }}>
            Payments are processed via Stripe. For Self-Funded and Forum Access categories, refunds are issued as GYN Credit Vouchers. See our{' '}
            <Link href="/refund-policy" style={{ color: 'var(--blue-deep)', textDecoration: 'underline' }}>refund policy</Link>.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <input
              id="reg-consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
              style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--blue-deep)', flexShrink: 0, cursor: 'pointer' }}
            />
            <label htmlFor="reg-consent" style={{ fontSize: '0.875rem', color: 'var(--navy-900)', lineHeight: 1.5, cursor: 'pointer' }}>
              I agree to the{' '}
              <Link href="/terms-conditions" style={{ color: 'var(--blue-deep)', textDecoration: 'underline' }}>Terms and Conditions</Link>
              <span aria-hidden="true" style={{ color: 'var(--crimson-600)', marginLeft: '0.125rem' }}>*</span>
            </label>
          </div>

          {turnstileSiteKey && (
            <>
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />
              <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-callback="__turnstileCb" />
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' as const }}>
            <button type="button" onClick={() => { setStep(0); setServerError(null) }} className="btn" style={{ background: 'transparent', color: 'var(--navy-900)', border: '2px solid var(--n-300)', minHeight: '44px' }}>
              Back to details
            </button>
            <button type="button" onClick={() => { void pay() }} className="btn btn-y" disabled={submitting} style={{ minHeight: '44px', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Processing...' : `Pay $${price} USD`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
