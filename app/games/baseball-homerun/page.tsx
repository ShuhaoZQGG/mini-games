import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const BaseballHomerun = dynamic(() => import('@/components/games/baseball-homerun'), { ssr: false })

export const metadata: Metadata = {
  title: 'Baseball Homerun | Mini Games Platform',
  description: 'Play Baseball Homerun - Batting practice derby with timing mechanics'
}

export default function BaseballHomerunPage() {
  return <BaseballHomerun />
}