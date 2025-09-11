'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, X, Clock, Users, Zap, ArrowUpDown } from 'lucide-react'

interface FilterOptions {
  difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert'
  playerCount: 'all' | '1' | '2' | '2+'
  duration: 'all' | 'quick' | 'medium' | 'long'
  tags: string[]
  sortBy: 'popular' | 'newest' | 'rating' | 'alphabetical'
}

interface DynamicCategoryFilterProps {
  category?: string
  onFilterChange: (filters: FilterOptions) => void
  availableTags?: string[]
  gameCount?: number
}

export function DynamicCategoryFilter({
  category,
  onFilterChange,
  availableTags = ['puzzle', 'action', 'strategy', 'arcade', 'card', 'board', 'casual', 'competitive'],
  gameCount = 0
}: DynamicCategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterOptions>({
    difficulty: 'all',
    playerCount: 'all',
    duration: 'all',
    tags: [],
    sortBy: 'popular'
  })
  
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)

  // Load filters from URL on mount
  useEffect(() => {
    const difficulty = searchParams.get('difficulty') as FilterOptions['difficulty'] || 'all'
    const playerCount = searchParams.get('players') as FilterOptions['playerCount'] || 'all'
    const duration = searchParams.get('duration') as FilterOptions['duration'] || 'all'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sort') as FilterOptions['sortBy'] || 'popular'

    const loadedFilters = { difficulty, playerCount, duration, tags, sortBy }
    setFilters(loadedFilters)
    updateActiveFilterCount(loadedFilters)
  }, [searchParams])

  const updateActiveFilterCount = (currentFilters: FilterOptions) => {
    let count = 0
    if (currentFilters.difficulty !== 'all') count++
    if (currentFilters.playerCount !== 'all') count++
    if (currentFilters.duration !== 'all') count++
    if (currentFilters.tags.length > 0) count += currentFilters.tags.length
    setActiveFilters(count)
  }

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    updateActiveFilterCount(newFilters)
    
    // Update URL params
    const params = new URLSearchParams()
    if (newFilters.difficulty !== 'all') params.set('difficulty', newFilters.difficulty)
    if (newFilters.playerCount !== 'all') params.set('players', newFilters.playerCount)
    if (newFilters.duration !== 'all') params.set('duration', newFilters.duration)
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','))
    if (newFilters.sortBy !== 'popular') params.set('sort', newFilters.sortBy)
    
    const queryString = params.toString()
    const url = queryString ? `?${queryString}` : window.location.pathname
    router.push(url, { scroll: false })
    
    // Notify parent component
    onFilterChange(newFilters)
  }

  const handleDifficultyChange = (value: string) => {
    updateFilters({ ...filters, difficulty: value as FilterOptions['difficulty'] })
  }

  const handlePlayerCountChange = (value: string) => {
    updateFilters({ ...filters, playerCount: value as FilterOptions['playerCount'] })
  }

  const handleDurationChange = (value: string) => {
    updateFilters({ ...filters, duration: value as FilterOptions['duration'] })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilters({ ...filters, tags: newTags })
  }

  const handleSortChange = (value: string) => {
    updateFilters({ ...filters, sortBy: value as FilterOptions['sortBy'] })
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      difficulty: 'all',
      playerCount: 'all',
      duration: 'all',
      tags: [],
      sortBy: 'popular'
    }
    updateFilters(clearedFilters)
    setIsOpen(false)
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Difficulty Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Difficulty
        </Label>
        <RadioGroup value={filters.difficulty} onValueChange={handleDifficultyChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="diff-all" />
            <Label htmlFor="diff-all">All Levels</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="easy" id="diff-easy" />
            <Label htmlFor="diff-easy">Easy</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="diff-medium" />
            <Label htmlFor="diff-medium">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hard" id="diff-hard" />
            <Label htmlFor="diff-hard">Hard</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expert" id="diff-expert" />
            <Label htmlFor="diff-expert">Expert</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Player Count Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Players
        </Label>
        <RadioGroup value={filters.playerCount} onValueChange={handlePlayerCountChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="players-all" />
            <Label htmlFor="players-all">Any</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="players-1" />
            <Label htmlFor="players-1">Single Player</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="players-2" />
            <Label htmlFor="players-2">Two Players</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2+" id="players-multi" />
            <Label htmlFor="players-multi">Multiplayer</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Duration Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Game Duration
        </Label>
        <RadioGroup value={filters.duration} onValueChange={handleDurationChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="duration-all" />
            <Label htmlFor="duration-all">Any Length</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="quick" id="duration-quick" />
            <Label htmlFor="duration-quick">Quick (&lt; 5 min)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="duration-medium" />
            <Label htmlFor="duration-medium">Medium (5-15 min)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="long" id="duration-long" />
            <Label htmlFor="duration-long">Long (&gt; 15 min)</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Tags Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Game Tags</Label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => handleTagToggle(tag)}
            >
              {filters.tags.includes(tag) && <X className="w-3 h-3 mr-1" />}
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          className="flex-1"
          onClick={clearAllFilters}
          disabled={activeFilters === 0}
        >
          Clear All
        </Button>
        <Button
          className="flex-1"
          onClick={() => setIsOpen(false)}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-4">
      {/* Desktop Filter Panel */}
      <div className="hidden lg:flex items-center gap-4 flex-1">
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="alphabetical">A to Z</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {filters.difficulty !== 'all' && (
            <Badge variant="secondary">
              Difficulty: {filters.difficulty}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilters({ ...filters, difficulty: 'all' })}
              />
            </Badge>
          )}
          {filters.playerCount !== 'all' && (
            <Badge variant="secondary">
              Players: {filters.playerCount}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilters({ ...filters, playerCount: 'all' })}
              />
            </Badge>
          )}
          {filters.duration !== 'all' && (
            <Badge variant="secondary">
              Duration: {filters.duration}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilters({ ...filters, duration: 'all' })}
              />
            </Badge>
          )}
          {filters.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          <Filter className="w-4 h-4 mr-2" />
          More Filters
          {activeFilters > 0 && (
            <Badge className="ml-2" variant="default">
              {activeFilters}
            </Badge>
          )}
        </Button>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Mobile Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilters > 0 && (
              <Badge className="ml-2" variant="default">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter Games</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {gameCount} {gameCount === 1 ? 'game' : 'games'} found
      </div>
    </div>
  )
}