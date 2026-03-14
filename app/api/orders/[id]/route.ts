import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware-helpers'
import { ok, noContent, badRequest, forbidden, notFound, serverError } from '@/lib/response'

const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    const { data: order, error } = await db
      .from('orders')
      .select('id, user_id, status, total_amount, notes, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !order) {
      return notFound('Order not found')
    }

    // ADMIN or own user
    if (user.role !== 'ADMIN' && order.user_id !== user.id) {
      return forbidden('You can only view your own orders')
    }

    const { data: items } = await db
      .from('order_items')
      .select('id, product_id, quantity, unit_price')
      .eq('order_id', id)

    return ok({ ...order, items: items ?? [] })
  } catch (err) {
    console.error('Get order exception:', err)
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
      return forbidden('Only admins can update order status')
    }

    const body = await req.json()
    const parsed = orderUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { data: existing } = await db
      .from('orders')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return notFound('Order not found')
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes
    }

    const { data: order, error } = await db
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select('id, user_id, status, total_amount, notes, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update order error:', error)
      return serverError('Failed to update order')
    }

    const { data: items } = await db
      .from('order_items')
      .select('id, product_id, quantity, unit_price')
      .eq('order_id', id)

    return ok({ ...order, items: items ?? [] })
  } catch (err) {
    console.error('PUT order exception:', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    const { data: order, error: fetchError } = await db
      .from('orders')
      .select('id, user_id, status')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !order) {
      return notFound('Order not found')
    }

    // ADMIN can always delete, USER can only delete pending own orders
    if (user.role !== 'ADMIN') {
      if (order.user_id !== user.id) {
        return forbidden('You can only delete your own orders')
      }
      if (order.status !== 'pending') {
        return forbidden('You can only delete pending orders')
      }
    }

    // Delete order items first
    await db.from('order_items').delete().eq('order_id', id)

    const { error } = await db.from('orders').delete().eq('id', id)

    if (error) {
      console.error('Delete order error:', error)
      return serverError('Failed to delete order')
    }

    return noContent()
  } catch (err) {
    console.error('DELETE order exception:', err)
    return serverError()
  }
}
