import { Metadata } from 'next'
import SubwayRunner from '@/components/games/action/SubwayRunner'

export const metadata: Metadata = {
  title: 'Subway Runner - Endless Running Game | Mini Games Platform',
  description: 'Run through subway tunnels, dodge trains, and collect coins! An endless runner game with fast-paced action and exciting challenges.',
  keywords: ['subway runner', 'endless runner', 'running game', 'action game', 'arcade runner', 'free runner game'],
}

export default function SubwayRunnerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SubwayRunner />
    </div>
  )
}