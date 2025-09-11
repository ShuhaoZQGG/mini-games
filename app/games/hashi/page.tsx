import { Metadata } from 'next'
import Hashi from '@/components/games/puzzle/Hashi'

export const metadata: Metadata = {
  title: 'Hashi (Bridges) - Island Connection Puzzle | Mini Games Platform',
  description: 'Connect islands with bridges following specific rules. A relaxing Japanese logic puzzle that challenges your strategic thinking.',
  keywords: ['hashi', 'bridges puzzle', 'island puzzle', 'logic game', 'japanese puzzle', 'free hashi'],
}

export default function HashiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Hashi />
    </div>
  )
}