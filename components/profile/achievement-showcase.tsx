'use client'

import { useState } from 'react'
import { Achievement } from '@/lib/services/profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Trophy, 
  Medal, 
  Star, 
  Target,
  Lock,
  Unlock,
  Search,
  Filter,
  Sparkles,
  Award,
  Zap,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AchievementShowcaseProps {
  achievements: Achievement[]
}

export default function AchievementShowcase({ achievements }: AchievementShowcaseProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')

  // Calculate statistics
  const totalAchievements = achievements.length
  const unlockedAchievements = achievements.filter(a => a.unlocked).length
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)
  const maxPoints = achievements.reduce((sum, a) => sum + a.points, 0)

  // Group achievements by category
  const categories = ['all', ...new Set(achievements.map(a => a.category))]
  const rarities = ['all', 'common', 'rare', 'epic', 'legendary']

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory
    const matchesRarity = selectedRarity === 'all' || achievement.rarity === selectedRarity
    
    return matchesSearch && matchesCategory && matchesRarity
  })

  // Separate unlocked and locked achievements
  const unlockedFiltered = filteredAchievements.filter(a => a.unlocked)
  const lockedFiltered = filteredAchievements.filter(a => !a.unlocked)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500'
      case 'rare':
        return 'bg-blue-500'
      case 'epic':
        return 'bg-purple-500'
      case 'legendary':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Sparkles className="w-4 h-4" />
      case 'epic':
        return <Star className="w-4 h-4" />
      case 'rare':
        return <Medal className="w-4 h-4" />
      default:
        return <Award className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'games':
        return '🎮'
      case 'scores':
        return '🏆'
      case 'social':
        return '👥'
      case 'special':
        return '⭐'
      default:
        return '🎯'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Overview</CardTitle>
          <CardDescription>Your achievement progress and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Trophy className="w-5 h-5 text-yellow-500" />}
              label="Unlocked"
              value={`${unlockedAchievements}/${totalAchievements}`}
              subtext={`${Math.round((unlockedAchievements / totalAchievements) * 100)}% Complete`}
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-purple-500" />}
              label="Total Points"
              value={totalPoints.toLocaleString()}
              subtext={`of ${maxPoints.toLocaleString()} possible`}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              label="Completion Rate"
              value={`${Math.round((unlockedAchievements / totalAchievements) * 100)}%`}
              subtext="Keep going!"
            />
            <StatCard
              icon={<Star className="w-5 h-5 text-orange-500" />}
              label="Rarest Unlocked"
              value={
                unlockedFiltered
                  .sort((a, b) => {
                    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 }
                    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
                  })[0]?.name || 'None'
              }
              subtext={unlockedFiltered[0]?.rarity || ''}
            />
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{unlockedAchievements}/{totalAchievements}</span>
            </div>
            <Progress 
              value={(unlockedAchievements / totalAchievements) * 100} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Achievements</CardTitle>
              <CardDescription>Browse and track your achievement progress</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="grid grid-cols-5 w-full">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All' : (
                    <span className="flex items-center gap-1">
                      <span>{getCategoryIcon(category)}</span>
                      {category}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Rarity Filter */}
          <div className="flex gap-2 mb-6">
            {rarities.map(rarity => (
              <Badge
                key={rarity}
                variant={selectedRarity === rarity ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  selectedRarity === rarity && rarity !== 'all' 
                    ? getRarityColor(rarity) + ' text-white' 
                    : ''
                }`}
                onClick={() => setSelectedRarity(rarity)}
              >
                {rarity === 'all' ? 'All Rarities' : (
                  <span className="flex items-center gap-1">
                    {getRarityIcon(rarity)}
                    {rarity}
                  </span>
                )}
              </Badge>
            ))}
          </div>

          {/* Achievement Lists */}
          <Tabs defaultValue="unlocked" className="space-y-4">
            <TabsList>
              <TabsTrigger value="unlocked">
                Unlocked ({unlockedFiltered.length})
              </TabsTrigger>
              <TabsTrigger value="locked">
                Locked ({lockedFiltered.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unlocked" className="space-y-4">
              {unlockedFiltered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No unlocked achievements matching your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unlockedFiltered
                    .sort((a, b) => 
                      new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime()
                    )
                    .map(achievement => (
                      <AchievementCard 
                        key={achievement.id} 
                        achievement={achievement}
                        unlocked={true}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="locked" className="space-y-4">
              {lockedFiltered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No locked achievements matching your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lockedFiltered.map(achievement => (
                    <AchievementCard 
                      key={achievement.id} 
                      achievement={achievement}
                      unlocked={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Sub-components
function StatCard({ 
  icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  )
}

function AchievementCard({ 
  achievement, 
  unlocked 
}: { 
  achievement: Achievement
  unlocked: boolean
}) {
  const rarityColors = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500'
  }

  const rarityBgColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-orange-500'
  }

  return (
    <Card className={`${unlocked ? '' : 'opacity-60'} ${rarityColors[achievement.rarity]} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`text-3xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{achievement.name}</h3>
                  {unlocked ? (
                    <Unlock className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
              <Badge className={`${rarityBgColors[achievement.rarity]} text-white`}>
                {achievement.rarity}
              </Badge>
            </div>

            {/* Progress */}
            {achievement.progress !== undefined && achievement.total && (
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{achievement.progress}/{achievement.total}</span>
                </div>
                <Progress 
                  value={(achievement.progress / achievement.total) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                <Medal className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{achievement.points} points</span>
              </div>
              {unlocked && achievement.unlocked_at && (
                <span className="text-xs text-muted-foreground">
                  Unlocked {formatDistanceToNow(new Date(achievement.unlocked_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}