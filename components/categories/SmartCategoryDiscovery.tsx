'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { GameCategoryMapping, GameCategory, GameDifficulty, filterGames, GameFilterCriteria } from '@/lib/gameCategories'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Filter, 
  Grid3x3, 
  List, 
  LayoutGrid,
  Clock,
  TrendingUp,
  Star,
  Users,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'

interface SmartCategoryDiscoveryProps {
  initialCategory?: GameCategory
  onGameSelect?: (game: GameCategoryMapping) => void
}

type SortOption = '1h' | '24h' | '7d' | '30d' | 'plays' | 'rating' | 'newest' | 'recommended' | 'similar'
type DisplayMode = 'grid' | 'carousel' | 'list'

export function SmartCategoryDiscovery({ 
  initialCategory,
  onGameSelect 
}: SmartCategoryDiscoveryProps) {
  const [selectedCategories, setSelectedCategories] = useState<GameCategory[]>(
    initialCategory ? [initialCategory] : []
  )
  const [selectedDifficulties, setSelectedDifficulties] = useState<GameDifficulty[]>([])
  const [maxPlayTime, setMaxPlayTime] = useState<number>(60)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const categories: GameCategory[] = [
    'puzzle', 'action', 'strategy', 'arcade', 'card', 
    'memory', 'skill', 'casino', 'word', 'music', 'physics', 'simulation'
  ]

  const difficulties: GameDifficulty[] = ['easy', 'medium', 'hard']

  const popularTags = [
    'multiplayer', 'classic', 'quick', 'brain', 'reflex', 
    'strategy', 'puzzle', 'arcade', 'educational', 'relaxing'
  ]

  // Filter games based on criteria
  const filteredGames = useMemo(() => {
    const criteria: GameFilterCriteria = {
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      difficulty: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      maxPlayTime: maxPlayTime < 60 ? maxPlayTime : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sortBy: sortBy === 'plays' ? 'playCount' : 
              sortBy === 'rating' ? 'rating' : 
              sortBy === 'newest' ? 'newest' : 'name',
      sortOrder: 'desc'
    }

    let games = filterGames(criteria)

    // Simulated trending logic
    if (sortBy.includes('h') || sortBy.includes('d')) {
      // Shuffle for demo purposes - in production, this would fetch from API
      games = [...games].sort(() => Math.random() - 0.5)
    }

    return games
  }, [selectedCategories, selectedDifficulties, maxPlayTime, selectedTags, sortBy])

  // Update URL state
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','))
    }
    if (selectedDifficulties.length > 0) {
      params.set('difficulty', selectedDifficulties.join(','))
    }
    if (maxPlayTime < 60) {
      params.set('time', maxPlayTime.toString())
    }
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','))
    }
    if (sortBy !== 'recommended') {
      params.set('sort', sortBy)
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [selectedCategories, selectedDifficulties, maxPlayTime, selectedTags, sortBy])

  const toggleCategory = (category: GameCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleDifficulty = (difficulty: GameDifficulty) => {
    setSelectedDifficulties(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">
                  <span className="flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    Recommended
                  </span>
                </SelectItem>
                <SelectItem value="1h">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending (1h)
                  </span>
                </SelectItem>
                <SelectItem value="24h">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending (24h)
                  </span>
                </SelectItem>
                <SelectItem value="7d">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending (7d)
                  </span>
                </SelectItem>
                <SelectItem value="plays">
                  <span className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Most Played
                  </span>
                </SelectItem>
                <SelectItem value="rating">
                  <span className="flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    Top Rated
                  </span>
                </SelectItem>
                <SelectItem value="newest">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Newest
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Display Mode */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={displayMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setDisplayMode('grid')}
                className="p-2"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={displayMode === 'carousel' ? 'default' : 'ghost'}
                onClick={() => setDisplayMode('carousel')}
                className="p-2"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={displayMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setDisplayMode('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t">
            {/* Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map(difficulty => (
                  <Badge
                    key={difficulty}
                    variant={selectedDifficulties.includes(difficulty) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDifficulty(difficulty)}
                  >
                    {difficulty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Play Time */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Max Play Time: {maxPlayTime < 60 ? `${maxPlayTime} min` : 'Any'}
              </label>
              <Slider
                value={[maxPlayTime]}
                onValueChange={([value]) => setMaxPlayTime(value)}
                max={60}
                min={1}
                step={5}
                className="w-full"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">Features</label>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategories.length > 0 || 
              selectedDifficulties.length > 0 || 
              maxPlayTime < 60 || 
              selectedTags.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedDifficulties([])
                  setMaxPlayTime(60)
                  setSelectedTags([])
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredGames.length} games
        {selectedCategories.length > 0 && ` in ${selectedCategories.join(', ')}`}
      </div>

      {/* Games Display */}
      {displayMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredGames.map(game => (
            <Link key={game.id} href={game.path}>
              <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{game.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {game.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {game.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {game.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {game.avgPlayTime}m
                    </span>
                    {game.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {game.rating}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {displayMode === 'carousel' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {filteredGames.map(game => (
              <Link key={game.id} href={game.path}>
                <Card className="w-64 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{game.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {game.description}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{game.category}</Badge>
                      <Badge variant="outline">{game.difficulty}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {displayMode === 'list' && (
        <div className="space-y-2">
          {filteredGames.map(game => (
            <Link key={game.id} href={game.path}>
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{game.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {game.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <Badge variant="outline">{game.category}</Badge>
                    <Badge variant="outline">{game.difficulty}</Badge>
                    <span className="text-sm text-gray-500">
                      {game.avgPlayTime} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}