import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware-helpers'
import { ok, created, badRequest, serverError } from '@/lib/response'

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') ?? '10')))
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const from = (page - 1) * size
    const to = from + size - 1

    let query = db
      .from('orders')
      .select('id, user_id, status, total_amount, notes, created_at, updated_at', { count: 'exact' })

    // ADMIN sees all orders, USER only sees own
    if (user.role !== 'ADMIN') {
      query = query.eq('user_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      // Add one day to make it inclusive
      const endDate = new Date(date_to)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('created_at', endDate.toISOString())
    }

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('List orders error:', error)
      return serverError('Failed to fetch orders')
    }

    return ok({
      data: data ?? [],
      total: count ?? 0,
      page,
      size,
      total_pages: Math.ceil((count ?? 0) / size),
    })
  } catch (err) {
    console.error('List orders exception:', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    const body = await req.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { items, notes } = parsed.data

    // Fetch all products
    const productIds = items.map((i) => i.product_id)
    const { data: productsData, error: productsError } = await db
      .from('products')
      .select('id, name, price, stock')
      .in('id', productIds)

    if (productsError) {
      return serverError('Failed to validate products')
    }

    // Validate all products exist
    if (!productsData || productsData.length !== productIds.length) {
      const foundIds = productsData?.map((p) => p.id) ?? []
      const missing = productIds.filter((id) => !foundIds.includes(id))
      return badRequest(`Products not found: ${missing.join(', ')}`)
    }

    // Check stock
    const stockErrors: string[] = []
    for (const item of items) {
      const product = productsData.find((p) => p.id === item.product_id)!
      if (product.stock < item.quantity) {
        stockErrors.push(
          `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`
        )
      }
    }

    if (stockErrors.length > 0) {
      return badRequest('Stock validation failed', stockErrors)
    }

    // Calculate total
    let total_amount = 0
    const orderItemsToInsert: Array<{
      product_id: string
      quantity: number
      unit_price: number
      order_id?: string
    }> = []

    for (const item of items) {
      const product = productsData.find((p) => p.id === item.product_id)!
      const lineTotal = product.price * item.quantity
      total_amount += lineTotal
      orderItemsToInsert.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
      })
    }

    // Insert order
    const { data: order, error: orderError } = await db
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount,
        notes: notes ?? null,
      })
      .select('id, user_id, status, total_amount, notes, created_at, updated_at')
      .single()

    if (orderError || !order) {
      console.error('Create order error:', orderError)
      return serverError('Failed to create order')
    }

    // Insert order items
    const itemsWithOrderId = orderItemsToInsert.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { data: insertedItems, error: itemsError } = await db
      .from('order_items')
      .insert(itemsWithOrderId)
      .select('id, product_id, quantity, unit_price')

    if (itemsError) {
      console.error('Create order items error:', itemsError)
      // Attempt to clean up
      await db.from('orders').delete().eq('id', order.id)
      return serverError('Failed to create order items')
    }

    // Decrease stock
    for (const item of items) {
      const product = productsData.find((p) => p.id === item.product_id)!
      await db
        .from('products')
        .update({ stock: product.stock - item.quantity, updated_at: new Date().toISOString() })
        .eq('id', item.product_id)
    }

    return created({ ...order, items: insertedItems })
  } catch (err) {
    console.error('Create order exception:', err)
    return serverError()
  }
}
