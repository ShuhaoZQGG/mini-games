'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FriendList } from './friend-list'
import { ChallengeList } from './challenge-list'
import { friendService, type FriendStats } from '@/lib/services/friends'
import { challengeService, type ChallengeStats } from '@/lib/services/challenges'

export function FriendsPageComponent() {
  const [friendStats, setFriendStats] = useState<FriendStats | null>(null)
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Mock user ID - in production this would come from auth
  const userId = 'user_1'

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      await Promise.all([
        friendService.initialize(userId),
        challengeService.initialize(userId)
      ])

      const [fStats, cStats] = await Promise.all([
        friendService.getFriendStats(),
        challengeService.getChallengeStats()
      ])

      setFriendStats(fStats)
      setChallengeStats(cStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Friends & Challenges</h1>
        <p className="text-muted-foreground">
          Connect with friends, send challenges, and compete together!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Friends</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : friendStats?.totalFriends || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {friendStats?.onlineFriends || 0} online now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenges Won</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : challengeStats?.wonChallenges || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {challengeStats?.totalChallenges || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${Math.round(challengeStats?.winRate || 0)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {challengeStats?.lostChallenges || 0} losses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : challengeStats?.pendingChallenges || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              challenges waiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FriendList userId={userId} />
        <ChallengeList userId={userId} />
      </div>

      {/* Share Stats */}
      {challengeStats && (challengeStats.favoriteGame || challengeStats.favoriteOpponent) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challengeStats.favoriteGame && (
                <div>
                  <p className="text-sm text-muted-foreground">Most Challenged Game</p>
                  <p className="text-lg font-medium capitalize">
                    {challengeStats.favoriteGame.replace(/-/g, ' ')}
                  </p>
                </div>
              )}
              {challengeStats.favoriteOpponent && (
                <div>
                  <p className="text-sm text-muted-foreground">Favorite Opponent</p>
                  <p className="text-lg font-medium">
                    Friend #{challengeStats.favoriteOpponent.split('_')[1]}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}