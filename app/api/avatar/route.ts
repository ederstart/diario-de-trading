import { put, get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

/**
 * Upload da foto de perfil — usa a MESMA integração de imagens já existente (Vercel Blob).
 * O store pode estar configurado como privado, entao salvamos com access: 'private'
 * (mesmo padrao do /api/upload) e devolvemos a URL resolvida via get(pathname),
 * que é estável e funciona direto no <img>.
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
      access: 'private',
      addRandomSuffix: false,
    })

    // Resolve uma URL estável para o front exibir direto no <img>.
    const resolved = await get(blob.pathname, { access: 'private' })

    return NextResponse.json({ url: resolved?.url ?? blob.url, pathname: blob.pathname })
  } catch (err: any) {
    console.error('[avatar upload]', err)
    return NextResponse.json(
      { error: err?.message || 'Falha interna no upload' },
      { status: 500 }
    )
  }
}
