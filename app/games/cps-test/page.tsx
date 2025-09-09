import { Metadata } from 'next'
import { CPSTestWithLevels } from '@/components/games/cps-test-with-levels'

export const metadata: Metadata = {
  title: 'CPS Test - Clicks Per Second Test | Mini Games',
  description: 'Test your clicking speed with our CPS Test. Find out how many clicks per second you can achieve in 10 seconds!',
  keywords: 'cps test, clicks per second, click speed test, clicking game',
}

export default function CPSTestPage() {
  return (
    <div className="container-responsive py-8">
      <CPSTestWithLevels />
    </div>
  )
}