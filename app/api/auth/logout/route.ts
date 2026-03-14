import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware-helpers'
import { noContent, badRequest, serverError } from '@/lib/response'

const logoutSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const body = await req.json()
    const parsed = logoutSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { refresh_token } = parsed.data

    await db.from('refresh_tokens').delete().eq('token', refresh_token)

    return noContent()
  } catch (err) {
    console.error('Logout exception:', err)
    return serverError()
  }
}
