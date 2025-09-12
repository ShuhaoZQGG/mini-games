import { Metadata } from 'next'
import NinjaJump from '@/components/games/ninja-jump'

export const metadata: Metadata = {
  title: 'Ninja Jump - Wall-jumping Platformer | Mini Games',
  description: 'Jump between walls, avoid obstacles, and collect stars in this exciting ninja platformer game!',
  keywords: 'ninja jump, wall jump, platformer, action game, obstacle course',
}

export default function NinjaJumpPage() {
  return <NinjaJump />
}