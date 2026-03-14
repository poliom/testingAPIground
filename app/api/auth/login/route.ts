import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { email, password } = parsed.data

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, email, password_hash, full_name, role, avatar_url, created_at, updated_at')
      .eq('email', email)
      .maybeSingle()

    if (error || !profile) {
      return unauthorized('Invalid email or password')
    }

    const valid = await verifyPassword(password, profile.password_hash)
    if (!valid) {
      return unauthorized('Invalid email or password')
    }

    const access_token = await signAccessToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
    })
    const refresh_token = await signRefreshToken(profile.id)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await db.from('refresh_tokens').insert({
      user_id: profile.id,
      token: refresh_token,
      expires_at: expiresAt,
    })

    const { password_hash: _, ...user } = profile

    return ok({ access_token, refresh_token, user })
  } catch (err) {
    console.error('Login exception:', err)
    return serverError()
  }
}
