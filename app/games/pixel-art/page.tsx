import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pixel Art Creator - Design & Create | Mini Games',
  description: 'Create and share pixel art masterpieces. A creative tool for designing pixel art with easy-to-use controls.',
  keywords: 'pixel art, creative game, art creator, drawing game, pixel design',
}

export default function PixelArtPage() {
  return (
    <GamePlaceholder
      title="Pixel Art Creator"
      description="Create and share pixel art masterpieces"
      category="Simulation"
    />
  )
}