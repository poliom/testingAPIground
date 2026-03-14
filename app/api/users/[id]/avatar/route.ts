import { NextRequest } from 'next/server'
import { db } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware-helpers'
import { ok, badRequest, forbidden, notFound, serverError } from '@/lib/response'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await requireAuth(req)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // ADMIN or own user
    if (user.role !== 'ADMIN' && user.id !== id) {
      return forbidden('You can only upload your own avatar')
    }

    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return badRequest('No avatar file provided')
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return badRequest('Invalid file type. Allowed: jpeg, png, webp, gif')
    }

    const ext = file.type.split('/')[1]
    const path = `${id}/avatar.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await db.storage
      .from('avatars')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return serverError('Failed to upload avatar')
    }

    const { data: urlData } = db.storage.from('avatars').getPublicUrl(path)
    const avatar_url = urlData.publicUrl

    const { error: updateError } = await db
      .from('profiles')
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('Avatar URL update error:', updateError)
      return serverError('Failed to update avatar URL')
    }

    return ok({ avatar_url })
  } catch (err) {
    console.error('Avatar upload exception:', err)
    return serverError()
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, avatar_url')
      .eq('id', id)
      .maybeSingle()

    if (error || !profile) {
      return notFound('User not found')
    }

    return ok({ avatar_url: profile.avatar_url })
  } catch (err) {
    console.error('Get avatar exception:', err)
    return serverError()
  }
}
