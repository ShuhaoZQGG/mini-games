import { Metadata } from 'next'
import AimTrainer from '@/components/games/aim-trainer'

export const metadata: Metadata = {
  title: 'Aim Trainer - Test Your Accuracy | Mini Games',
  description: 'Improve your aim and reflexes with our Aim Trainer game. Click targets as fast as you can and test your accuracy!',
  keywords: 'aim trainer, accuracy game, reflex test, target practice, clicking game',
}

export default function AimTrainerPage() {
  return <AimTrainer />
}