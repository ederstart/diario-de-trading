import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new NextResponse('Não autorizado', { status: 401 })
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) return new NextResponse('Arquivo não informado', { status: 400 })
  const result = await get(pathname, { access: 'private' })
  if (!result) return new NextResponse('Não encontrado', { status: 404 })
  return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, 'Cache-Control': 'private, no-cache', ETag: result.blob.etag } })
}
