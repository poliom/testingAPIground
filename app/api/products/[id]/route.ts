import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireRole } from '@/lib/middleware-helpers'
import { ok, noContent, badRequest, notFound, serverError } from '@/lib/response'

const productSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: product, error } = await db
      .from('products')
      .select('id, name, description, price, category, stock, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !product) {
      return notFound('Product not found')
    }

    return ok(product)
  } catch (err) {
    console.error('Get product exception:', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const body = await req.json()
    const fullSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().nullable().optional(),
      price: z.number().positive('Price must be positive'),
      category: z.string().min(1, 'Category is required'),
      stock: z.number().int().min(0, 'Stock cannot be negative'),
    })

    const parsed = fullSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { data: existing } = await db
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('Product not found')
    }

    const { data: product, error } = await db
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, description, price, category, stock, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update product error:', error)
      return serverError('Failed to update product')
    }

    return ok(product)
  } catch (err) {
    console.error('PUT product exception:', err)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { data: existing } = await db
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('Product not found')
    }

    const { data: product, error } = await db
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, description, price, category, stock, created_at, updated_at')
      .single()

    if (error) {
      console.error('Patch product error:', error)
      return serverError('Failed to update product')
    }

    return ok(product)
  } catch (err) {
    console.error('PATCH product exception:', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const { data: existing } = await db
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('Product not found')
    }

    const { error } = await db.from('products').delete().eq('id', id)

    if (error) {
      console.error('Delete product error:', error)
      return serverError('Failed to delete product')
    }

    return noContent()
  } catch (err) {
    console.error('DELETE product exception:', err)
    return serverError()
  }
}
