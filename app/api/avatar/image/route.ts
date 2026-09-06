import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

/**
 * Serve a foto de perfil salva no Blob privado.
 * URL estável: /api/avatar/image?path=avatars/<userId>/<arquivo>
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pathname = request.nextUrl.searchParams.get('path')
  const prefix = `avatars/${session.user.id}/`
  if (!pathname || !pathname.startsWith(prefix) || pathname.includes('..')) {
    return NextResponse.json({ error: 'Imagem inválida' }, { status: 400 })
  }

  const blob = await get(pathname, { access: 'private' })
  if (!blob) return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })

  return new Response(blob.stream, {
    headers: {
      'Content-Type': blob.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'private, max-age=60',
    },
  })
}
