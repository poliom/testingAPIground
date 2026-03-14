import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { created, badRequest, conflict, serverError } from '@/lib/response'

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { email, password, full_name } = parsed.data

    // Check email uniqueness
    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return conflict('Email already registered')
    }

    const password_hash = await hashPassword(password)

    const { data: profile, error } = await db
      .from('profiles')
      .insert({
        email,
        password_hash,
        full_name: full_name ?? null,
        role: 'USER',
      })
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      console.error('Register error:', error)
      return serverError('Failed to create user')
    }

    return created(profile)
  } catch (err) {
    console.error('Register exception:', err)
    return serverError()
  }
}
