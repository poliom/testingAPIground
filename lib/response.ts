import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: 'Bad Request', message, details }, { status: 400 })
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: 'Unauthorized', message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: 'Forbidden', message }, { status: 403 })
}

export function notFound(message = 'Not Found') {
  return NextResponse.json({ error: 'Not Found', message }, { status: 404 })
}

export function conflict(message: string) {
  return NextResponse.json({ error: 'Conflict', message }, { status: 409 })
}

export function serverError(message = 'Internal Server Error') {
  return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 })
}
