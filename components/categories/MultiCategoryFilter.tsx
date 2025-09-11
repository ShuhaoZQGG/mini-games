'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  X, 
  ChevronDown, 
  Star, 
  Clock, 
  TrendingUp,
  Sparkles,
  Zap,
  Grid
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  GameCategory, 
  GameDifficulty, 
  GameFilterCriteria,
  filterGames,
  GameCategoryMapping 
} from '@/lib/gameCategories'

interface MultiCategoryFilterProps {
  onFilterChange: (games: GameCategoryMapping[]) => void
  className?: string
}

const categories: { value: GameCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'puzzle', label: 'Puzzle', icon: <Grid className="w-4 h-4" /> },
  { value: 'action', label: 'Action', icon: <Zap className="w-4 h-4" /> },
  { value: 'strategy', label: 'Strategy', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'arcade', label: 'Arcade', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'card', label: 'Card', icon: <Star className="w-4 h-4" /> },
  { value: 'memory', label: 'Memory', icon: <Clock className="w-4 h-4" /> },
  { value: 'skill', label: 'Skill', icon: <Star className="w-4 h-4" /> },
  { value: 'casino', label: 'Casino', icon: <Star className="w-4 h-4" /> },
  { value: 'word', label: 'Word', icon: <Star className="w-4 h-4" /> },
  { value: 'music', label: 'Music', icon: <Star className="w-4 h-4" /> },
  { value: 'physics', label: 'Physics', icon: <Star className="w-4 h-4" /> },
  { value: 'simulation', label: 'Simulation', icon: <Star className="w-4 h-4" /> },
]

const difficulties: { value: GameDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500' },
]

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Popular' },
  { value: 'playCount', label: 'Most Played' },
  { value: 'newest', label: 'Newest' },
  { value: 'difficulty', label: 'Difficulty' },
]

export function MultiCategoryFilter({ onFilterChange, className }: MultiCategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<GameFilterCriteria>({
    categories: [],
    categoryLogic: 'OR',
    difficulty: [],
    minRating: 0,
    sortBy: 'rating',
    sortOrder: 'desc',
  })
  const [activeTags, setActiveTags] = useState<string[]>([])

  useEffect(() => {
    const filteredGames = filterGames(filters)
    onFilterChange(filteredGames)
  }, [filters, onFilterChange])

  const toggleCategory = (category: GameCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category],
    }))
  }

  const toggleDifficulty = (difficulty: GameDifficulty) => {
    setFilters(prev => ({
      ...prev,
      difficulty: prev.difficulty?.includes(difficulty)
        ? prev.difficulty.filter(d => d !== difficulty)
        : [...(prev.difficulty || []), difficulty],
    }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      categoryLogic: 'OR',
      difficulty: [],
      minRating: 0,
      sortBy: 'rating',
      sortOrder: 'desc',
    })
    setActiveTags([])
  }

  const activeFilterCount = 
    (filters.categories?.length || 0) + 
    (filters.difficulty?.length || 0) + 
    (filters.minRating && filters.minRating > 0 ? 1 : 0) +
    activeTags.length

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "w-4 h-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {(isExpanded || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-6 p-4 bg-background/50 rounded-lg border backdrop-blur-sm">
              {/* Active Filter Tags */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  {filters.categories?.map(cat => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  {filters.difficulty?.map(diff => (
                    <Badge
                      key={diff}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => toggleDifficulty(diff)}
                    >
                      {diff}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  {filters.minRating && filters.minRating > 0 && (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                    >
                      {filters.minRating}+ stars
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Categories */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(({ value, label, icon }) => (
                    <Button
                      key={value}
                      variant={filters.categories?.includes(value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(value)}
                      className="flex items-center gap-1"
                    >
                      {icon}
                      {label}
                    </Button>
                  ))}
                </div>
                
                {/* Category Logic */}
                {(filters.categories?.length || 0) > 1 && (
                  <RadioGroup
                    value={filters.categoryLogic}
                    onValueChange={(value: 'AND' | 'OR') => 
                      setFilters(prev => ({ ...prev, categoryLogic: value }))
                    }
                    className="flex gap-4 mt-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="OR" id="or" />
                      <Label htmlFor="or" className="text-sm cursor-pointer">
                        Match any category
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="AND" id="and" />
                      <Label htmlFor="and" className="text-sm cursor-pointer">
                        Match all categories
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              </div>

              {/* Difficulty */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Difficulty</Label>
                <div className="flex gap-2">
                  {difficulties.map(({ value, label, color }) => (
                    <Button
                      key={value}
                      variant={filters.difficulty?.includes(value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDifficulty(value)}
                      className="flex items-center gap-2"
                    >
                      <div className={cn("w-2 h-2 rounded-full", color)} />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Minimum Rating</Label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map(rating => (
                    <Button
                      key={rating}
                      variant={filters.minRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                      className="flex items-center gap-1"
                    >
                      {rating > 0 && <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />}
                      {rating === 0 ? 'All' : `${rating}+`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="sort" className="text-sm font-semibold mb-2 block">
                    Sort by
                  </Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: any) => 
                      setFilters(prev => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger id="sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="order" className="text-sm font-semibold mb-2 block">
                    Order
                  </Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => 
                      setFilters(prev => ({ ...prev, sortOrder: value }))
                    }
                  >
                    <SelectTrigger id="order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}