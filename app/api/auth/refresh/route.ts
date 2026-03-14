import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = refreshSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { refresh_token } = parsed.data

    // Verify JWT validity
    const payload = await verifyRefreshToken(refresh_token)
    if (!payload) {
      return unauthorized('Invalid or expired refresh token')
    }

    // Check token exists in DB and not expired
    const { data: tokenRecord } = await db
      .from('refresh_tokens')
      .select('id, user_id, expires_at')
      .eq('token', refresh_token)
      .maybeSingle()

    if (!tokenRecord) {
      return unauthorized('Refresh token not found')
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      await db.from('refresh_tokens').delete().eq('id', tokenRecord.id)
      return unauthorized('Refresh token expired')
    }

    // Fetch user info
    const { data: profile } = await db
      .from('profiles')
      .select('id, email, role')
      .eq('id', tokenRecord.user_id)
      .maybeSingle()

    if (!profile) {
      return unauthorized('User not found')
    }

    // Delete old token
    await db.from('refresh_tokens').delete().eq('id', tokenRecord.id)

    // Sign new tokens
    const access_token = await signAccessToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
    })
    const new_refresh_token = await signRefreshToken(profile.id)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await db.from('refresh_tokens').insert({
      user_id: profile.id,
      token: new_refresh_token,
      expires_at: expiresAt,
    })

    return ok({ access_token, refresh_token: new_refresh_token })
  } catch (err) {
    console.error('Refresh exception:', err)
    return serverError()
  }
}
