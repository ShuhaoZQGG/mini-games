import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const BasketballShootout = dynamic(() => import('@/components/games/basketball-shootout'), { ssr: false })

export const metadata: Metadata = {
  title: 'Basketball Shootout | Mini Games Platform',
  description: 'Play Basketball Shootout - Free throw accuracy with physics simulation'
}

export default function BasketballShootoutPage() {
  return <BasketballShootout />
}