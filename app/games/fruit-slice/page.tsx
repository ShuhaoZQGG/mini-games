import { Metadata } from 'next'
import FruitSlice from '@/components/games/action/FruitSlice'

export const metadata: Metadata = {
  title: 'Fruit Slice - Ninja Slicing Game | Mini Games Platform',
  description: 'Slice flying fruits with swift swipes! Avoid bombs and achieve high scores in this addictive action game.',
  keywords: ['fruit slice', 'ninja game', 'slicing game', 'action game', 'arcade game', 'free fruit ninja'],
}

export default function FruitSlicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FruitSlice />
    </div>
  )
}