import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

/**
 * Upload da foto de perfil.
 *
 * CORREÇÃO: o blob é privado, então a URL devolvida por `put()`/`get()` é
 * assinada e EXPIRA — por isso a foto sumia depois de trocar. Agora guardamos
 * apenas o `pathname` e servimos a imagem por uma rota própria e estável
 * (`/api/avatar/image?path=...`), do mesmo jeito que os anexos das operações.
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

    const safeName = file.name.replace(/[^\w.\-]/g, '_')
    const blob = await put(`avatars/${session.user.id}/${crypto.randomUUID()}-${safeName}`, file, {
      access: 'private',
      addRandomSuffix: false,
    })

    // URL estável (nunca expira) + cache-buster para o <img> recarregar na hora.
    const url = `/api/avatar/image?path=${encodeURIComponent(blob.pathname)}&v=${Date.now()}`

    return NextResponse.json({ url, pathname: blob.pathname })
  } catch (err: any) {
    console.error('[avatar upload]', err)
    return NextResponse.json({ error: err?.message || 'Falha interna no upload' }, { status: 500 })
  }
}
