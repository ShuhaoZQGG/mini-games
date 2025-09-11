import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const TennisRally = dynamic(() => import('@/components/games/tennis-rally'), { ssr: false })

export const metadata: Metadata = {
  title: 'Tennis Rally | Mini Games Platform',
  description: 'Play Tennis Rally - Volley survival with increasing speed'
}

export default function TennisRallyPage() {
  return <TennisRally />
}