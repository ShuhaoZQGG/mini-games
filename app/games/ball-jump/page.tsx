import { Metadata } from 'next'
import BallJump from '@/components/games/action/BallJump'

export const metadata: Metadata = {
  title: 'Ball Jump - Bouncing Platform Game | Mini Games Platform',
  description: 'Bounce your ball through platforms and obstacles! Time your jumps perfectly in this addictive action game.',
  keywords: ['ball jump', 'bouncing game', 'platform game', 'action game', 'jumping game', 'free ball game'],
}

export default function BallJumpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BallJump />
    </div>
  )
}