import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware-helpers'
import { ok, noContent, badRequest, forbidden, notFound, serverError } from '@/lib/response'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().nullable().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // ADMIN can get anyone, users can only get themselves
    if (user.role !== 'ADMIN' && user.id !== id) {
      return forbidden('You can only view your own profile')
    }

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !profile) {
      return notFound('User not found')
    }

    return ok(profile)
  } catch (err) {
    console.error('Get user exception:', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    if (user.role !== 'ADMIN') {
      return forbidden('Only admins can perform full user updates')
    }

    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
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
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update user error:', error)
      return serverError('Failed to update user')
    }

    return ok(profile)
  } catch (err) {
    console.error('PUT user exception:', err)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // ADMIN or own user
    if (user.role !== 'ADMIN' && user.id !== id) {
      return forbidden('You can only update your own profile')
    }

    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    // Non-admins cannot change role
    if (user.role !== 'ADMIN' && parsed.data.role) {
      return forbidden('You cannot change your own role')
    }

    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('User not found')
    }

    const updateData = { ...parsed.data, updated_at: new Date().toISOString() }
    if (user.role !== 'ADMIN') {
      delete updateData.role
    }

    const { data: profile, error } = await db
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      console.error('Patch user error:', error)
      return serverError('Failed to update user')
    }

    return ok(profile)
  } catch (err) {
    console.error('PATCH user exception:', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    if (user.role !== 'ADMIN') {
      return forbidden('Only admins can delete users')
    }

    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('User not found')
    }

    const { error } = await db.from('profiles').delete().eq('id', id)

    if (error) {
      console.error('Delete user error:', error)
      return serverError('Failed to delete user')
    }

    return noContent()
  } catch (err) {
    console.error('DELETE user exception:', err)
    return serverError()
  }
}
