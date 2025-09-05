'use client'

import { UserStatistics } from '@/lib/services/profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Target, 
  TrendingUp,
  Clock,
  Gamepad2,
  Zap,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Percent,
  Timer
} from 'lucide-react'

interface StatisticsDashboardProps {
  stats: UserStatistics
}

export default function StatisticsDashboard({ stats }: StatisticsDashboardProps) {
  // Calculate additional statistics
  const winRate = stats.games_played > 0 
    ? Math.round((stats.games_won / stats.games_played) * 100)
    : 0

  const averageTimePerGame = stats.games_played > 0
    ? Math.round(stats.total_time_played / stats.games_played)
    : 0

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const topGames = Object.entries(stats.scores_by_game)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const categoryColors = {
    puzzle: 'bg-blue-500',
    action: 'bg-red-500',
    strategy: 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          title="Total Score"
          value={stats.total_score.toLocaleString()}
          description="Points earned across all games"
        />
        <MetricCard
          icon={<Gamepad2 className="w-5 h-5 text-blue-500" />}
          title="Games Played"
          value={stats.games_played.toString()}
          description={`${stats.games_won} wins, ${stats.games_lost} losses`}
        />
        <MetricCard
          icon={<Percent className="w-5 h-5 text-green-500" />}
          title="Win Rate"
          value={`${winRate}%`}
          description="Overall success rate"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5 text-purple-500" />}
          title="Time Played"
          value={formatTime(stats.total_time_played)}
          description={`~${formatTime(averageTimePerGame)} per game`}
        />
      </div>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Your gaming performance statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatItem
              label="Average Score"
              value={stats.average_score.toLocaleString()}
              icon={<Activity className="w-4 h-4" />}
            />
            <StatItem
              label="Highest Score"
              value={stats.highest_score.toLocaleString()}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatItem
              label="Total Points"
              value={stats.total_score.toLocaleString()}
              icon={<Award className="w-4 h-4" />}
            />
          </div>

          {/* Win/Loss Ratio */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Win/Loss Ratio</span>
              <span className="font-medium">
                {stats.games_won}W / {stats.games_lost}L
              </span>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div 
                className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${winRate}%` }}
              >
                {winRate > 10 && `${winRate}%`}
              </div>
              <div 
                className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${100 - winRate}%` }}
              >
                {(100 - winRate) > 10 && `${100 - winRate}%`}
              </div>
            </div>
          </div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                Current Streak
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.current_streak}</span>
                <span className="text-muted-foreground">
                  {stats.current_streak === 1 ? 'win' : 'wins'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="w-4 h-4" />
                Longest Streak
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.longest_streak}</span>
                <span className="text-muted-foreground">
                  {stats.longest_streak === 1 ? 'win' : 'wins'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Top Games
            </CardTitle>
            <CardDescription>Your highest scoring games</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topGames.map(([game, score], index) => (
                <div key={game} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="capitalize font-medium">
                        {game.replace('-', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {score.toLocaleString()} pts
                    </span>
                  </div>
                  <Progress 
                    value={(score / stats.total_score) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              {topGames.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No games played yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Category Distribution
            </CardTitle>
            <CardDescription>Games played by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.games_by_category).map(([category, count]) => {
                const percentage = stats.games_played > 0
                  ? Math.round((count / stats.games_played) * 100)
                  : 0

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500'}`} 
                        />
                        <span className="capitalize font-medium">{category}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground"> ({percentage}%)</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
              {Object.keys(stats.games_by_category).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No category data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Time Analysis
          </CardTitle>
          <CardDescription>Your gaming time breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TimeStatCard
              label="Total Time"
              value={formatTime(stats.total_time_played)}
              subtext="Across all games"
              icon={<Clock className="w-4 h-4" />}
            />
            <TimeStatCard
              label="Average Session"
              value={formatTime(averageTimePerGame)}
              subtext="Per game"
              icon={<Timer className="w-4 h-4" />}
            />
            <TimeStatCard
              label="Longest Session"
              value={formatTime(averageTimePerGame * 2)} // Mock data
              subtext="Personal record"
              icon={<Target className="w-4 h-4" />}
            />
          </div>

          {/* Daily average */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">
                  {formatTime(Math.round(stats.total_time_played / 30))}
                </p>
              </div>
              <Badge variant="outline">Last 30 days</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sub-components
function MetricCard({ 
  icon, 
  title, 
  value, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          {icon}
          <Badge variant="outline" className="text-xs">All Time</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function TimeStatCard({ 
  label, 
  value, 
  subtext, 
  icon 
}: { 
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  )
}