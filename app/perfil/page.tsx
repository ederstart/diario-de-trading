import { ProfilePanel } from '@/components/profile-panel'
import { getProfile } from '@/app/actions/gamification'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PerfilPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const profile = await getProfile()
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
            <h1 className="text-2xl font-bold">Sua jornada como trader</h1>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            Voltar ao diário
          </Link>
        </div>
        <ProfilePanel initialProfile={profile} />
      </div>
    </main>
  )
}
