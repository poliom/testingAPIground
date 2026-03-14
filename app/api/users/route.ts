import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { requireRole } from '@/lib/middleware-helpers'
import { ok, created, badRequest, conflict, serverError } from '@/lib/response'

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).default('USER'),
})

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') ?? '10')))
    const sort = searchParams.get('sort') ?? 'created_at'
    const order = searchParams.get('order') === 'asc' ? true : false

    const validSortFields = ['created_at', 'email', 'full_name', 'role', 'updated_at']
    const sortField = validSortFields.includes(sort) ? sort : 'created_at'

    const from = (page - 1) * size
    const to = from + size - 1

    const { data, error, count } = await db
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, created_at, updated_at', { count: 'exact' })
      .order(sortField, { ascending: order })
      .range(from, to)

    if (error) {
      console.error('List users error:', error)
      return serverError('Failed to fetch users')
    }

    return ok({
      data: data ?? [],
      total: count ?? 0,
      page,
      size,
      total_pages: Math.ceil((count ?? 0) / size),
    })
  } catch (err) {
    console.error('List users exception:', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { email, password, full_name, role } = parsed.data

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
      .insert({ email, password_hash, full_name: full_name ?? null, role })
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      console.error('Create user error:', error)
      return serverError('Failed to create user')
    }

    return created(profile)
  } catch (err) {
    console.error('Create user exception:', err)
    return serverError()
  }
}
