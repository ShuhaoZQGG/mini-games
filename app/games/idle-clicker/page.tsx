import IdleClicker from '@/components/games/idle-clicker'

export const metadata = {
  title: 'Idle Clicker - Mini Games',
  description: 'Incremental clicking game with upgrades'
}

export default function IdleClickerPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Idle Clicker</h1>
      <IdleClicker />
    </div>
  )
}