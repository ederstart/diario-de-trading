import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

/**
 * Upload da foto de perfil — usa a MESMA integração de imagens já existente (Vercel Blob).
 * Diferença para /api/upload: o avatar é salvo como público, para poder ser exibido
 * direto no <img> sem gerar URL assinada a cada render.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem inválida (máximo 5MB)' }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[avatar] BLOB_READ_WRITE_TOKEN ausente')
      return NextResponse.json({ error: 'Upload indisponível no momento' }, { status: 503 })
    }

    const blob = await put(`avatars/${session.user.id}/${crypto.randomUUID()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err: any) {
    console.error('[avatar upload]', err)
    return NextResponse.json(
      { error: err?.message || 'Falha interna no upload' },
      { status: 500 }
    )
  }
}
