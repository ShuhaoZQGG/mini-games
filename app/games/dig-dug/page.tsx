import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const DigDug = dynamic(() => import('@/components/games/dig-dug'), { ssr: false })

export const metadata: Metadata = {
  title: 'Dig Dug | Mini Games Platform',
  description: 'Play Dig Dug - Underground monster hunter with inflation mechanic'
}

export default function DigDugPage() {
  return <DigDug />
}