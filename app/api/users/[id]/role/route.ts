import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireRole } from '@/lib/middleware-helpers'
import { ok, badRequest, notFound, serverError } from '@/lib/response'

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'GUEST']),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const body = await req.json()
    const parsed = roleSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('User not found')
    }

    const { data: profile, error } = await db
      .from('profiles')
      .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update role error:', error)
      return serverError('Failed to update role')
    }

    return ok(profile)
  } catch (err) {
    console.error('Role update exception:', err)
    return serverError()
  }
}
