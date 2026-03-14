import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
