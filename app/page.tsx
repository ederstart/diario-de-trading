import TradingDashboard from '@/components/trading-dashboard'
import { auth } from '@/lib/auth'
import { getTradingData } from '@/app/actions/trading'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const data = await getTradingData()
  return <TradingDashboard user={session.user} initialData={data} />
}
