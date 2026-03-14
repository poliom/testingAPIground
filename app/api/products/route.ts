import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/supabase'
import { requireRole } from '@/lib/middleware-helpers'
import { created, badRequest, serverError } from '@/lib/response'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') ?? '10')))
    const sort = searchParams.get('sort') ?? 'created_at'
    const order = searchParams.get('order') === 'asc' ? true : false

    const validSortFields = ['price', 'name', 'created_at', 'stock', 'updated_at']
    const sortField = validSortFields.includes(sort) ? sort : 'created_at'

    const from = (page - 1) * size
    const to = from + size - 1

    let query = db
      .from('products')
      .select('id, name, description, price, category, stock, created_at, updated_at', { count: 'exact' })

    if (category) {
      query = query.eq('category', category)
    }

    query = query.order(sortField, { ascending: order }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('List products error:', error)
      return serverError('Failed to fetch products')
    }

    const responseData = {
      data: data ?? [],
      total: count ?? 0,
      page,
      size,
      total_pages: Math.ceil((count ?? 0) / size),
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (err) {
    console.error('List products exception:', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(req, 'ADMIN')
    if (authResult instanceof Response) return authResult

    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }

    const { data: product, error } = await db
      .from('products')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: parsed.data.price,
        category: parsed.data.category,
        stock: parsed.data.stock,
      })
      .select('id, name, description, price, category, stock, created_at, updated_at')
      .single()

    if (error) {
      console.error('Create product error:', error)
      return serverError('Failed to create product')
    }

    return created(product)
  } catch (err) {
    console.error('Create product exception:', err)
    return serverError()
  }
}
