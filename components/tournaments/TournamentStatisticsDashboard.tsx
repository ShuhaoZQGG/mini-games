'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Trophy,
  TrendingUp,
  Award,
  DollarSign,
  Target,
  Users,
  Calendar,
  Download,
  Share2,
  Copy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  GameController,
  Percent
} from 'lucide-react'
import { tournamentHistoryService, TournamentStatistics, TournamentHistoryEntry } from '@/lib/services/tournament-history'

interface TournamentStatisticsDashboardProps {
  userId: string
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']
const ITEMS_PER_PAGE = 10

export function TournamentStatisticsDashboard({ userId }: TournamentStatisticsDashboardProps) {
  const [statistics, setStatistics] = useState<TournamentStatistics | null>(null)
  const [history, setHistory] = useState<TournamentHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('performance')
  const { toast } = useToast()

  // Filter states
  const [gameFilter, setGameFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'placement' | 'score'>('date')

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    loadStatistics()
    loadHistory()
  }, [userId])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const stats = await tournamentHistoryService.getUserStatistics(userId)
      setStatistics(stats)
    } catch (err) {
      setError('Failed to load statistics')
      console.error('Error loading statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const filters: any = {}
      if (gameFilter !== 'all') filters.gameSlug = gameFilter
      if (startDate) filters.startDate = new Date(startDate)
      if (endDate) filters.endDate = new Date(endDate)
      if (sortBy) filters.sortBy = sortBy

      const data = gameFilter !== 'all' || startDate || endDate
        ? await tournamentHistoryService.searchTournamentHistory(userId, filters)
        : await tournamentHistoryService.getUserTournamentHistory(userId)
      
      setHistory(data)
    } catch (err) {
      console.error('Error loading history:', err)
    }
  }

  const applyFilters = () => {
    setCurrentPage(1)
    loadHistory()
  }

  const resetFilters = () => {
    setGameFilter('all')
    setStartDate('')
    setEndDate('')
    setSortBy('date')
    loadHistory()
  }

  const exportCSV = () => {
    if (!statistics || !history) return

    const csvContent = [
      ['Tournament Statistics Report'],
      ['Generated on', new Date().toISOString()],
      [],
      ['Overview'],
      ['Total Tournaments', statistics.totalTournaments],
      ['Tournaments Won', statistics.tournamentsWon],
      ['Win Rate', `${statistics.winRate}%`],
      ['Best Placement', statistics.bestPlacement],
      ['Total Prize Won', `$${statistics.totalPrizeWon}`],
      [],
      ['Tournament History'],
      ['Date', 'Game', 'Placement', 'Matches Won', 'Matches Played', 'Prize'],
      ...history.map(h => [
        format(h.completedAt, 'yyyy-MM-dd'),
        h.gameSlug || 'Unknown',
        h.placement,
        h.matchesWon,
        h.matchesPlayed,
        h.prizeWon || 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tournament-statistics-${userId}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Export successful',
      description: 'Statistics exported to CSV file',
    })
  }

  const shareStatistics = async () => {
    if (!statistics) return

    const shareData = {
      title: 'My Tournament Statistics',
      text: `I've played ${statistics.totalTournaments} tournaments with a ${statistics.winRate}% win rate! Check out my stats.`,
      url: `${window.location.origin}/users/${userId}/tournament-stats`
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        toast({
          title: 'Link copied!',
          description: 'Statistics link copied to clipboard',
        })
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/users/${userId}/tournament-stats`
    await navigator.clipboard.writeText(url)
    toast({
      title: 'Link copied!',
      description: 'Statistics link copied to clipboard',
    })
  }

  // Prepare chart data
  const performanceData = useMemo(() => {
    return history.slice(0, 10).reverse().map(h => ({
      date: format(h.completedAt, 'MMM d'),
      placement: h.placement,
      winRate: h.winRate || 0
    }))
  }, [history])

  const gamesData = useMemo(() => {
    if (!statistics) return []
    return Object.entries(statistics.gamesPlayed).map(([game, count]) => ({
      name: game.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count
    }))
  }, [statistics])

  const placementData = useMemo(() => {
    const placements: Record<string, number> = {}
    history.forEach(h => {
      const key = h.placement === 1 ? '1st' : h.placement === 2 ? '2nd' : h.placement === 3 ? '3rd' : '4th+'
      placements[key] = (placements[key] || 0) + 1
    })
    return Object.entries(placements).map(([placement, count]) => ({
      placement,
      count
    }))
  }, [history])

  // Pagination
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE)
  const paginatedHistory = history.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (loading) {
    return (
      <div data-testid="statistics-loading" className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadStatistics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!statistics || statistics.totalTournaments === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tournament history yet</h3>
          <p className="text-gray-500">Join your first tournament to see statistics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" data-testid={isMobile ? 'mobile-stats-view' : 'desktop-stats-view'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tournament Statistics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={shareStatistics}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Statistics
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`} data-testid={isMobile ? 'swipeable-stats-cards' : ''}>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tournaments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTournaments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.winRate.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Best Placement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.bestPlacement === 1 ? '1st' : 
               statistics.bestPlacement === 2 ? '2nd' :
               statistics.bestPlacement === 3 ? '3rd' :
               `${statistics.bestPlacement}th`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Winnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statistics.totalPrizeWon}</div>
          </CardContent>
        </Card>
      </div>

      {/* Match Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matches Played</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalMatchesPlayed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Match Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.matchWinRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Favorite Game */}
      {statistics.favoriteGame && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Favorite Game</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GameController className="w-5 h-5" />
              <span className="text-xl font-semibold">
                {statistics.favoriteGame.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <Badge variant="secondary">
                {statistics.gamesPlayed[statistics.favoriteGame]} tournaments
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">CPS Test</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="placements">Placements</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="performance" className="mt-0">
            <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="placement" stroke="#6366f1" name="Placement" />
                <Line type="monotone" dataKey="winRate" stroke="#10b981" name="Win Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="placements" className="mt-0">
            <h3 className="text-lg font-semibold mb-4">Placement Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={placementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="placement" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="games" className="mt-0">
            <h3 className="text-lg font-semibold mb-4">Games Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gamesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gamesData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="game-filter">Filter by game</Label>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger id="game-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {Object.keys(statistics.gamesPlayed).map(game => (
                    <SelectItem key={game} value={game}>
                      {game.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="sort-by">Sort by</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger id="sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="placement">Placement</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tournaments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tournaments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paginatedHistory.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">
                    {entry.gameSlug?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Championship
                  </h4>
                  <Badge variant={entry.placement === 1 ? 'default' : 'secondary'}>
                    {entry.placement === 1 ? '1st' : 
                     entry.placement === 2 ? '2nd' :
                     entry.placement === 3 ? '3rd' :
                     `${entry.placement}th`} place
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>{format(entry.completedAt, 'MMM d, yyyy')}</p>
                  <p>Won {entry.matchesWon}/{entry.matchesPlayed} matches</p>
                  {entry.prizeWon && entry.prizeWon > 0 && (
                    <p>Prize: ${entry.prizeWon}</p>
                  )}
                </div>
              </div>
              <Link href={`/tournaments/${entry.tournamentId}`}>
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}