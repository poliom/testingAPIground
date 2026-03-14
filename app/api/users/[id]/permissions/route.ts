import { NextRequest } from 'next/server'
import { db } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware-helpers'
import { ok, notFound, serverError } from '@/lib/response'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'read:users',
    'write:users',
    'delete:users',
    'read:products',
    'write:products',
    'delete:products',
    'read:orders',
    'write:orders',
    'delete:orders',
    'manage:roles',
    'manage:avatars',
  ],
  USER: [
    'read:own_profile',
    'write:own_profile',
    'read:products',
    'read:own_orders',
    'write:own_orders',
    'delete:own_pending_orders',
  ],
  GUEST: ['read:products'],
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .maybeSingle()

    if (error || !profile) {
      return notFound('User not found')
    }

    const permissions = ROLE_PERMISSIONS[profile.role] ?? []

    return ok({ role: profile.role, permissions })
  } catch (err) {
    console.error('Permissions exception:', err)
    return serverError()
  }
}
