import { Metadata } from 'next'
import NinjaRun from '@/components/games/action/NinjaRun'

export const metadata: Metadata = {
  title: 'Ninja Run - Fast-Paced Platform Game | Mini Games Platform',
  description: 'Run, jump, and slash through obstacles as a ninja! Master wall jumps and combat in this fast-paced action platformer.',
  keywords: ['ninja run', 'platform game', 'ninja game', 'action game', 'runner game', 'free ninja game'],
}

export default function NinjaRunPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NinjaRun />
    </div>
  )
}