import { Metadata } from 'next'
import OnlineConnectFive from '@/components/games/multiplayer/OnlineConnectFive'

export const metadata: Metadata = {
  title: 'Online Connect Five - Strategic Board Game | Mini Games Platform',
  description: 'Play Connect Five online! Get five pieces in a row while blocking your opponent in this enhanced version of the classic connection game.',
  keywords: ['online connect five', 'strategy game', 'multiplayer board game', 'gomoku', 'five in a row', 'free connect game'],
}

export default function OnlineConnectFivePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineConnectFive />
    </div>
  )
}