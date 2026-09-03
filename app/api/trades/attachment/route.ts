import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pathname = request.nextUrl.searchParams.get('path')
  const prefix = `trades/${session.user.id}/`
  if (!pathname || !pathname.startsWith(prefix)) return NextResponse.json({ error: 'Anexo inválido' }, { status: 400 })

  const blob = await get(pathname, { access: 'private' })
  if (!blob) return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })

  return new Response(blob.stream, {
    headers: { 'Content-Type': blob.contentType || 'application/octet-stream', 'Cache-Control': 'private, no-store' },
  })
}
