'use client'

import { useState, useEffect } from 'react'
import { useProfile, trackGamePlay, Achievement } from '@/lib/services/profiles'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, 
  User, 
  TrendingUp,
  Award,
  Zap,
  Target,
  Star,
  Medal,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface GameWrapperProps {
  gameId: string
  gameName: string
  category: 'puzzle' | 'action' | 'strategy'
  children: React.ReactNode
  onScoreSubmit?: (score: number, metadata?: any) => void
  showProfile?: boolean
  showAchievements?: boolean
}

export default function GameWrapper({
  gameId,
  gameName,
  category,
  children,
  onScoreSubmit,
  showProfile = true,
  showAchievements = true
}: GameWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile(userId || undefined)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [showAchievementAlert, setShowAchievementAlert] = useState(false)
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now())

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        setUserId(user.id)
      } else {
        // Use guest session ID as user ID for tracking
        const guestId = localStorage.getItem('guest_session_id')
        if (guestId) {
          setUserId(guestId)
        }
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    // Track game start
    setGameStartTime(Date.now())
  }, [gameId])

  const handleGameEnd = async (score: number, won: boolean = false, metadata?: any) => {
    if (!userId) return

    const timePlayed = Math.round((Date.now() - gameStartTime) / 1000) // in seconds

    // Track game play in profile
    const result = await trackGamePlay(userId, gameId, score, {
      won,
      time_played: timePlayed,
      ...metadata
    })

    if (result.success && result.newAchievements && result.newAchievements.length > 0) {
      setNewAchievements(result.newAchievements)
      setShowAchievementAlert(true)
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowAchievementAlert(false)
      }, 5000)
    }

    // Refresh profile to show updated stats
    refreshProfile()

    // Call parent's onScoreSubmit if provided
    if (onScoreSubmit) {
      onScoreSubmit(score, { ...metadata, won, time_played: timePlayed })
    }
  }

  // Inject the handleGameEnd function into the game component
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onGameEnd: handleGameEnd
      })
    }
    return child
  })

  return (
    <div className="space-y-4">
      {/* Profile Mini Display */}
      {showProfile && profile && !profileLoading && (
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                  <AvatarFallback>
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.username}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="w-3 h-3" />
                    <span>{profile.total_score.toLocaleString()} pts</span>
                    <span>•</span>
                    <Target className="w-3 h-3" />
                    <span>{profile.total_games_played} games</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats for this game */}
              {profile.stats.scores_by_game[gameId] && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">This Game</p>
                  <p className="font-medium">
                    {profile.stats.scores_by_game[gameId].toLocaleString()} pts
                  </p>
                </div>
              )}
            </div>

            {/* Current Streak Display */}
            {profile.stats.current_streak > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm">
                  <strong>{profile.stats.current_streak}</strong> win streak!
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Component */}
      <div>{childrenWithProps}</div>

      {/* Achievement Unlocked Alert */}
      {showAchievements && showAchievementAlert && newAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <Alert className="w-96 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <AlertDescription className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Achievement Unlocked!
                  </AlertDescription>
                  <div className="mt-2 space-y-2">
                    {newAchievements.map(achievement => (
                      <div key={achievement.id} className="flex items-start gap-2">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                              {achievement.rarity}
                            </Badge>
                            <span className="text-xs text-yellow-700 dark:text-yellow-300">
                              +{achievement.points} points
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAchievementAlert(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Game-specific achievements progress (optional) */}
      {showAchievements && profile && (
        <GameAchievements gameId={gameId} profile={profile} />
      )}
    </div>
  )
}

// Helper component for game-specific achievements
function GameAchievements({ gameId, profile }: { gameId: string; profile: any }) {
  // Filter achievements related to this game
  const gameAchievements = profile.achievements.filter((a: Achievement) => {
    // Check if achievement is related to this game
    return a.id.includes(gameId) || 
           (a.category === 'special' && a.description.toLowerCase().includes(gameId.replace('-', ' ')))
  })

  if (gameAchievements.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Medal className="w-4 h-4" />
          Game Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {gameAchievements.map((achievement: Achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-2 p-2 rounded-lg border ${
                achievement.unlocked 
                  ? 'bg-card' 
                  : 'bg-muted/30 opacity-60'
              }`}
            >
              <span className="text-lg">{achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{achievement.name}</p>
                {achievement.progress !== undefined && achievement.total && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                )}
              </div>
              {achievement.unlocked && (
                <Star className="w-3 h-3 text-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common':
      return 'bg-gray-500 text-white'
    case 'rare':
      return 'bg-blue-500 text-white'
    case 'epic':
      return 'bg-purple-500 text-white'
    case 'legendary':
      return 'bg-orange-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

// Export React for cloneElement
import React from 'react'