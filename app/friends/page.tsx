import { Metadata } from 'next'
import { FriendsPageComponent } from '@/components/social/friends-page'

export const metadata: Metadata = {
  title: 'Friends - Mini Games',
  description: 'Connect with friends, send challenges, and compete on the leaderboards',
}

export default function FriendsPage() {
  return (
    <div className="container-responsive py-8">
      <FriendsPageComponent />
    </div>
  )
}