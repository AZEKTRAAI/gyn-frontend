'use client'

/**
 * ContactForm — react-hook-form + zod, POSTs to /api/contact per the contract.
 * Inline errors, success state, failure state, honeypot anti-spam field.
 * topic can be pre-filled via the `defaultTopic` prop (from ?topic= query param).
 * Turnstile: rendered when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; script loaded only then.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Script from 'next/script'
import { useState, useEffect } from 'react'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  topic: z.enum(['general', 'partnership', 'group-booking', 'media'], {
    error: () => ({ message: 'Select a topic' }),
  }),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be 2000 characters or fewer'),
  // honeypot — must stay empty
  website: z.string().max(0).optional(),
})

type ContactInput = z.infer<typeof contactSchema>

const TOPIC_LABELS: Record<string, string> = {
  general: 'General enquiry',
  partnership: 'Partnership',
  'group-booking': 'Group booking',
  media: 'Media',
}

interface Props {
  defaultTopic?: 'general' | 'partnership' | 'group-booking' | 'media'
}

export function ContactForm({ defaultTopic = 'general' }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: defaultTopic },
  })

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>()

  // Register Turnstile callback on window so the widget can call it
  useEffect(() => {
    if (!turnstileSiteKey) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Turnstile global callback
    ;(window as any).__cfTurnstileCb = (t: string) => setTurnstileToken(t)
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__cfTurnstileCb
    }
  }, [turnstileSiteKey])

  async function onSubmit(data: ContactInput) {
    if (turnstileSiteKey && !turnstileToken) {
      setError('root', { message: 'Please complete the security check.' })
      return
    }

    // discard honeypot before sending
    const { website: _hp, ...rest } = data
    void _hp
    const payload = { ...rest, ...(turnstileToken ? { turnstileToken } : {}) }

    let res: Response
    try {
      res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      setError('root', { message: 'Network error. Please try again.' })
      return
    }

    if (res.ok) return // isSubmitSuccessful handles the success state

    if (res.status === 429) {
      setError('root', { message: 'Too many requests. Please wait a few minutes and try again.' })
      return
    }

    if (res.status === 400) {
      const body = (await res.json()) as { fieldErrors?: Record<string, string[]> }
      if (body.fieldErrors) {
        for (const [field, msgs] of Object.entries(body.fieldErrors)) {
          // "form" errors (e.g. the security check) belong in the form-level message, not on a field (RT-075)
          setError(field === 'form' ? 'root' : (field as keyof ContactInput), { message: msgs[0] })
        }
      } else {
        setError('root', { message: 'Please check your input and try again.' })
      }
      return
    }

    setError('root', { message: 'Something went wrong. Please email contact@thegyn.org directly.' })
  }

  if (isSubmitSuccessful) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: '2rem',
          background: 'var(--paper)',
          borderLeft: '4px solid var(--leaf-600)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--fd)',
            fontSize: '1rem',
            color: 'var(--navy-700)',
            marginBottom: '0.5rem',
          }}
        >
          Message sent
        </p>
        <p style={{ fontSize: '0.9375rem', color: 'var(--n-700)', lineHeight: 1.65 }}>
          Thanks for reaching out. We will get back to you at the email address you provided.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: '1.25rem' }}
          className="btn btn-n"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Load Turnstile script only when the site key is configured */}
      {turnstileSiteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Honeypot — hidden from sighted users and screen readers */}
        <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
          <label htmlFor="cf-website">Leave this blank</label>
          <input
            id="cf-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('website')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name */}
          <div>
            <label htmlFor="cf-name" style={labelStyle}>
              Name <span aria-hidden="true" style={{ color: 'var(--crimson-600)' }}>*</span>
            </label>
            <input
              id="cf-name"
              type="text"
              autoComplete="name"
              aria-required="true"
              aria-describedby={errors.name ? 'cf-name-err' : undefined}
              aria-invalid={!!errors.name}
              style={inputStyle(!!errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <p id="cf-name-err" role="alert" style={errorStyle}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="cf-email" style={labelStyle}>
              Email <span aria-hidden="true" style={{ color: 'var(--crimson-600)' }}>*</span>
            </label>
            <input
              id="cf-email"
              type="email"
              autoComplete="email"
              aria-required="true"
              aria-describedby={errors.email ? 'cf-email-err' : undefined}
              aria-invalid={!!errors.email}
              style={inputStyle(!!errors.email)}
              {...register('email')}
            />
            {errors.email && (
              <p id="cf-email-err" role="alert" style={errorStyle}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="cf-topic" style={labelStyle}>
              Topic <span aria-hidden="true" style={{ color: 'var(--crimson-600)' }}>*</span>
            </label>
            <select
              id="cf-topic"
              aria-required="true"
              aria-describedby={errors.topic ? 'cf-topic-err' : undefined}
              aria-invalid={!!errors.topic}
              style={{ ...inputStyle(!!errors.topic), cursor: 'pointer' }}
              {...register('topic')}
            >
              {Object.entries(TOPIC_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.topic && (
              <p id="cf-topic-err" role="alert" style={errorStyle}>
                {errors.topic.message}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="cf-message" style={labelStyle}>
              Message <span aria-hidden="true" style={{ color: 'var(--crimson-600)' }}>*</span>
            </label>
            <textarea
              id="cf-message"
              rows={6}
              aria-required="true"
              aria-describedby={errors.message ? 'cf-message-err' : undefined}
              aria-invalid={!!errors.message}
              style={{ ...inputStyle(!!errors.message), resize: 'vertical' }}
              placeholder="Please let us know what is on your mind."
              {...register('message')}
            />
            {errors.message && (
              <p id="cf-message-err" role="alert" style={errorStyle}>
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Turnstile widget — rendered only when the site key is set */}
          {turnstileSiteKey && (
            <div
              className="cf-turnstile"
              data-sitekey={turnstileSiteKey}
              data-callback="__cfTurnstileCb"
            />
          )}

          {/* Root / network errors */}
          {errors.root && (
            <div
              role="alert"
              style={{
                padding: '0.875rem 1rem',
                background: '#fff0f1',
                borderLeft: '4px solid var(--crimson-600)',
              }}
            >
              <p style={{ fontSize: '0.9375rem', color: 'var(--n-800)' }}>
                {errors.root.message}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-n"
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: '0.375rem',
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontFamily: 'var(--fb)',
    fontSize: '0.9375rem',
    color: 'var(--n-900)',
    background: 'var(--white)',
    border: `2px solid ${hasError ? 'var(--crimson-600)' : 'var(--n-300)'}`,
    transition: 'border-color 150ms cubic-bezier(0.23, 1, 0.32, 1)',
  }
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--crimson-600)',
  marginTop: '0.25rem',
}
