import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getTradingData } from '@/app/actions/trading'
import ProfilePanel from '@/components/profile-panel'

export default async function PerfilPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const data = await getTradingData()
  return <ProfilePanel user={{ name: data.user?.name ?? session.user.name, email: data.user?.email ?? session.user.email }} progress={data.progress} tradeCount={data.trades.length} />
}
