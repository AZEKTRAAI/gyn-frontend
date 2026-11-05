'use server'

import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'

export async function loginAction(_previous: { error?: string } | null, formData: FormData): Promise<{ error?: string }> {
  const result = await signIn(String(formData.get('email') ?? ''), String(formData.get('password') ?? ''))
  if (!result.ok) return { error: result.error }
  redirect('/')
}
