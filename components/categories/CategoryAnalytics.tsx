'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Download,
  Calendar,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getCategoryStats, CategoryStats, GameCategory } from '@/lib/gameCategories'

type TimeRange = 'day' | 'week' | 'month' | 'year'

interface AnalyticsData {
  date: string
  plays: number
  uniquePlayers: number
  avgSessionTime: number
  completionRate: number
}

// Mock data generator for demonstration
function generateMockData(category: GameCategory, timeRange: TimeRange): AnalyticsData[] {
  const dataPoints = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12
  const data: AnalyticsData[] = []
  
  for (let i = 0; i < dataPoints; i++) {
    const basePlays = Math.floor(Math.random() * 1000) + 500
    data.push({
      date: timeRange === 'day' ? `${i}:00` : 
            timeRange === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] :
            timeRange === 'month' ? `Day ${i + 1}` : 
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      plays: basePlays + Math.floor(Math.random() * 200),
      uniquePlayers: Math.floor(basePlays * 0.7) + Math.floor(Math.random() * 100),
      avgSessionTime: Math.floor(Math.random() * 15) + 5,
      completionRate: Math.floor(Math.random() * 40) + 60,
    })
  }
  
  return data
}

interface CategoryAnalyticsProps {
  className?: string
}

export function CategoryAnalytics({ className }: CategoryAnalyticsProps) {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('puzzle')
  const [compareCategory, setCompareCategory] = useState<GameCategory | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [compareData, setCompareData] = useState<AnalyticsData[]>([])
  
  const categoryStats = useMemo(() => getCategoryStats(), [])
  const currentStats = categoryStats.find(s => s.category === selectedCategory)
  const compareStats = compareCategory ? categoryStats.find(s => s.category === compareCategory) : null

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setAnalyticsData(generateMockData(selectedCategory, timeRange))
      if (compareCategory) {
        setCompareData(generateMockData(compareCategory, timeRange))
      }
    }, 5000)

    // Initial load
    setAnalyticsData(generateMockData(selectedCategory, timeRange))
    if (compareCategory) {
      setCompareData(generateMockData(compareCategory, timeRange))
    }

    return () => clearInterval(interval)
  }, [selectedCategory, compareCategory, timeRange])

  const exportToCSV = () => {
    const headers = ['Date', 'Plays', 'Unique Players', 'Avg Session Time', 'Completion Rate']
    const rows = analyticsData.map(d => [
      d.date,
      d.plays.toString(),
      d.uniquePlayers.toString(),
      d.avgSessionTime.toString(),
      d.completionRate.toString()
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCategory}-analytics-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    // In a real implementation, you would use a library like jsPDF
    alert('PDF export would be implemented with a library like jsPDF')
  }

  // Calculate trend (mock)
  const calculateTrend = (data: AnalyticsData[]) => {
    if (data.length < 2) return 0
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.plays, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.plays, 0) / secondHalf.length
    return ((secondAvg - firstAvg) / firstAvg) * 100
  }

  const trend = calculateTrend(analyticsData)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedCategory} onValueChange={(v: GameCategory) => setSelectedCategory(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryStats.map(stat => (
                <SelectItem key={stat.category} value={stat.category}>
                  {stat.category.charAt(0).toUpperCase() + stat.category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={compareCategory || 'none'} 
            onValueChange={(v) => setCompareCategory(v === 'none' ? null : v as GameCategory)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Compare with..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No comparison</SelectItem>
              {categoryStats
                .filter(s => s.category !== selectedCategory)
                .map(stat => (
                  <SelectItem key={stat.category} value={stat.category}>
                    {stat.category.charAt(0).toUpperCase() + stat.category.slice(1)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 hours</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Games</CardDescription>
            <CardTitle className="text-2xl">{currentStats?.gameCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {compareStats && (
                <span>vs {compareStats.gameCount} in {compareCategory}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Rating</CardDescription>
            <CardTitle className="text-2xl">
              {(currentStats?.avgRating || 0).toFixed(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <ArrowUp className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-500" />
              )}
              <span className={cn("text-xs", trend > 0 ? "text-green-500" : "text-red-500")}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Plays</CardDescription>
            <CardTitle className="text-2xl">
              {(currentStats?.totalPlayCount || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={75} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Play Time</CardDescription>
            <CardTitle className="text-2xl">
              {(currentStats?.avgPlayTime || 0).toFixed(0)} min
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Per session
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="plays" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plays">Plays</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="time">Session Time</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
        </TabsList>

        <TabsContent value="plays" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Play Count Over Time</CardTitle>
              <CardDescription>
                Number of game plays in the selected time range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end gap-1">
                {analyticsData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.plays / 1500) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.plays} plays
                      </div>
                    </motion.div>
                    {compareData.length > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(compareData[i].plays / 1500) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="w-full bg-secondary rounded-t"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">{data.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unique Players</CardTitle>
              <CardDescription>
                Number of unique players over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end gap-1">
                {analyticsData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.uniquePlayers / 1000) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-400 transition-colors relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.uniquePlayers} players
                      </div>
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{data.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Session Time</CardTitle>
              <CardDescription>
                Average time spent per game session (minutes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end gap-1">
                {analyticsData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.avgSessionTime / 20) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full bg-green-500 rounded-t hover:bg-green-400 transition-colors relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.avgSessionTime} min
                      </div>
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{data.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate</CardTitle>
              <CardDescription>
                Percentage of games completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end gap-1">
                {analyticsData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${data.completionRate}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full bg-purple-500 rounded-t hover:bg-purple-400 transition-colors relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.completionRate}%
                      </div>
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{data.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Popular Tags */}
      {currentStats && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Tags</CardTitle>
            <CardDescription>
              Most common tags in {selectedCategory} games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentStats.popularTags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}