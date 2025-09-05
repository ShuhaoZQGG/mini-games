'use client'

import { useState, useEffect } from 'react'
import { useProfile, UserProfile } from '@/lib/services/profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Trophy, 
  Target, 
  Zap, 
  Calendar,
  Gamepad2,
  Award,
  TrendingUp,
  Clock,
  Edit,
  Share2,
  Medal
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ProfileEditor from './profile-editor'
import AchievementShowcase from './achievement-showcase'
import StatisticsDashboard from './statistics-dashboard'

interface UserProfileProps {
  userId?: string
  isOwnProfile?: boolean
  onEdit?: () => void
}

export default function UserProfileComponent({ 
  userId, 
  isOwnProfile = false,
  onEdit 
}: UserProfileProps) {
  const { profile, loading, error, refresh } = useProfile(userId)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  if (loading) {
    return <ProfileSkeleton />
  }

  if (error || !profile) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Unable to load profile</p>
          <Button onClick={refresh} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalAchievements = profile.achievements.length
  const unlockedAchievements = profile.achievements.filter(a => a.unlocked).length
  const achievementProgress = totalAchievements > 0 
    ? Math.round((unlockedAchievements / totalAchievements) * 100)
    : 0

  const totalPoints = profile.achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0)

  return (
    <>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                  <AvatarFallback className="text-2xl">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{profile.username}</h1>
                    {profile.win_rate >= 60 && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Trophy className="w-3 h-3 mr-1" />
                        Elite
                      </Badge>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-muted-foreground mb-3">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                    </Badge>
                    {profile.favorite_game && (
                      <Badge variant="outline">
                        <Gamepad2 className="w-3 h-3 mr-1" />
                        Loves {profile.favorite_game.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <StatCard
                  icon={<Trophy className="w-4 h-4" />}
                  label="Total Score"
                  value={profile.total_score.toLocaleString()}
                  color="text-yellow-500"
                />
                <StatCard
                  icon={<Target className="w-4 h-4" />}
                  label="Games Played"
                  value={profile.total_games_played.toString()}
                  color="text-blue-500"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Win Rate"
                  value={`${profile.win_rate}%`}
                  color="text-green-500"
                />
                <StatCard
                  icon={<Award className="w-4 h-4" />}
                  label="Points"
                  value={totalPoints.toString()}
                  color="text-purple-500"
                />
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setShowEditor(true)} size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
            </div>

            {/* Achievement Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Achievement Progress</span>
                <span className="font-medium">{unlockedAchievements}/{totalAchievements} Unlocked</span>
              </div>
              <Progress value={achievementProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Different Sections */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Streaks */}
            {profile.stats.current_streak > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{profile.stats.current_streak}</span>
                    <span className="text-muted-foreground">
                      {profile.stats.current_streak === 1 ? 'win' : 'wins'} in a row
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Best streak: {profile.stats.longest_streak} wins
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Latest unlocked achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.achievements
                    .filter(a => a.unlocked)
                    .sort((a, b) => 
                      new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime()
                    )
                    .slice(0, 6)
                    .map(achievement => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                </div>
                {unlockedAchievements === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No achievements unlocked yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Game Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Favorite Games</CardTitle>
                <CardDescription>Score distribution by game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(profile.stats.scores_by_game)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([game, score]) => (
                      <div key={game} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                          <span className="capitalize">{game.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{score.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">points</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementShowcase achievements={profile.achievements} />
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsDashboard stats={profile.stats} />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest gaming activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.stats.recent_activity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                  {profile.stats.recent_activity.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Editor Modal */}
      {showEditor && profile && (
        <ProfileEditor
          profile={profile}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            setShowEditor(false)
            refresh()
          }}
        />
      )}
    </>
  )
}

// Sub-components
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: any }) {
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-orange-500'
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="text-2xl">{achievement.icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{achievement.name}</h4>
          <Badge className={`${rarityColors[achievement.rarity as keyof typeof rarityColors]} text-white`}>
            {achievement.rarity}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
        {achievement.unlocked_at && (
          <p className="text-xs text-muted-foreground mt-1">
            Unlocked {formatDistanceToNow(new Date(achievement.unlocked_at), { addSuffix: true })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Medal className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">{achievement.points}</span>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: any }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'game_played':
        return <Gamepad2 className="w-4 h-4" />
      case 'achievement_unlocked':
        return <Trophy className="w-4 h-4" />
      case 'high_score':
        return <Zap className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getActivityText = () => {
    switch (activity.type) {
      case 'game_played':
        return `Played ${activity.game_name} - Score: ${activity.score?.toLocaleString()}`
      case 'achievement_unlocked':
        return `Unlocked achievement: ${activity.achievement_name}`
      case 'high_score':
        return `New high score in ${activity.game_name}: ${activity.score?.toLocaleString()}`
      default:
        return 'Activity'
    }
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{getActivityIcon()}</div>
        <span className="text-sm">{getActivityText()}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
      </span>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}