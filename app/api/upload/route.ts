import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const form = await request.formData(); const file = form.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Imagem inválida (máximo 5MB)' }, { status: 400 })
  const blob = await put(`trades/${session.user.id}/${crypto.randomUUID()}-${file.name}`, file, { access: 'private', addRandomSuffix: false })
  return NextResponse.json({ pathname: blob.pathname })
}
