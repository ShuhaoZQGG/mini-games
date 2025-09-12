'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, TrendingUp, Users, Clock, Trophy, Star, ChevronRight, Grid, List } from 'lucide-react'
import { gameCategories } from '@/lib/gameCategories'

interface CategoryMetrics {
  categoryId: string
  playCount: number
  avgRating: number
  popularGames: string[]
  trendingGames: string[]
  newGames: string[]
}

interface MultiCategoryGame {
  id: string
  name: string
  primaryCategory: string
  secondaryCategories: string[]
  tags: string[]
  popularity: number
  rating: number
  isNew: boolean
  isTrending: boolean
}

export function EnhancedCategorySystem() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'newest' | 'alphabetical'>('popularity')
  const [showOnlyMultiCategory, setShowOnlyMultiCategory] = useState(false)
  
  // Generate multi-category mappings for games
  const multiCategoryGames = useMemo(() => {
    const games: MultiCategoryGame[] = gameCategories.map(game => {
      // Determine secondary categories based on tags
      const secondaryCategories: string[] = []
      
      if (game.tags.includes('puzzle') && game.category !== 'puzzle') {
        secondaryCategories.push('puzzle')
      }
      if (game.tags.includes('strategy') && game.category !== 'strategy') {
        secondaryCategories.push('strategy')
      }
      if (game.tags.includes('quick') || game.avgPlayTime <= 5) {
        secondaryCategories.push('quick-play')
      }
      if (game.tags.includes('2-player')) {
        secondaryCategories.push('multiplayer')
      }
      if (game.tags.includes('classic')) {
        secondaryCategories.push('classic')
      }
      
      return {
        id: game.id,
        name: game.name,
        primaryCategory: game.category,
        secondaryCategories,
        tags: game.tags,
        popularity: Math.random() * 100, // Simulated popularity score
        rating: 3.5 + Math.random() * 1.5, // Simulated rating
        isNew: Math.random() > 0.8, // Randomly mark some as new
        isTrending: Math.random() > 0.85 // Randomly mark some as trending
      }
    })
    
    return games
  }, [])
  
  // Filter games based on selected categories
  const filteredGames = useMemo(() => {
    let filtered = [...multiCategoryGames]
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(game => 
        selectedCategories.includes(game.primaryCategory) ||
        game.secondaryCategories.some(cat => selectedCategories.includes(cat))
      )
    }
    
    if (showOnlyMultiCategory) {
      filtered = filtered.filter(game => game.secondaryCategories.length > 0)
    }
    
    // Sort games
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.popularity - a.popularity)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    
    return filtered
  }, [multiCategoryGames, selectedCategories, showOnlyMultiCategory, sortBy])
  
  const categories = [
    { id: 'puzzle', name: 'Puzzle', icon: '🧩', color: 'bg-purple-500' },
    { id: 'action', name: 'Action', icon: '⚡', color: 'bg-red-500' },
    { id: 'strategy', name: 'Strategy', icon: '♟️', color: 'bg-blue-500' },
    { id: 'arcade', name: 'Arcade', icon: '🕹️', color: 'bg-green-500' },
    { id: 'card', name: 'Card', icon: '🃏', color: 'bg-yellow-500' },
    { id: 'memory', name: 'Memory', icon: '🧠', color: 'bg-pink-500' },
    { id: 'skill', name: 'Skill', icon: '🎯', color: 'bg-indigo-500' },
    { id: 'word', name: 'Word', icon: '📝', color: 'bg-orange-500' },
    { id: 'quick-play', name: 'Quick Play', icon: '⏱️', color: 'bg-cyan-500' },
    { id: 'multiplayer', name: 'Multiplayer', icon: '👥', color: 'bg-teal-500' },
    { id: 'classic', name: 'Classic', icon: '🎮', color: 'bg-gray-500' }
  ]
  
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter by Categories
          </h3>
          <button
            onClick={() => setSelectedCategories([])}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Clear All
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCategory(category.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${selectedCategories.includes(category.id)
                  ? `${category.color} text-white`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </motion.button>
          ))}
        </div>
        
        {/* Additional Filters */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyMultiCategory}
                onChange={(e) => setShowOnlyMultiCategory(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm">Show only multi-category games</span>
            </label>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm bg-gray-100 dark:bg-gray-700 rounded px-3 py-1"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Trending Games</p>
              <p className="text-2xl font-bold">
                {multiCategoryGames.filter(g => g.isTrending).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-75" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Multi-Category</p>
              <p className="text-2xl font-bold">
                {multiCategoryGames.filter(g => g.secondaryCategories.length > 0).length}
              </p>
            </div>
            <Grid className="w-8 h-8 opacity-75" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">New Games</p>
              <p className="text-2xl font-bold">
                {multiCategoryGames.filter(g => g.isNew).length}
              </p>
            </div>
            <Star className="w-8 h-8 opacity-75" />
          </div>
        </div>
      </div>
      
      {/* Filtered Games Display */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedCategories.length > 0 
              ? `Games (${filteredGames.length} results)`
              : `All Games (${filteredGames.length})`
            }
          </h3>
        </div>
        
        <AnimatePresence mode="popLayout">
          {viewMode === 'grid' ? (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredGames.map(game => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{game.name}</h4>
                    {game.isTrending && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        Trending
                      </span>
                    )}
                    {game.isNew && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(game.rating) 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">
                      {game.rating.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                      {game.primaryCategory}
                    </span>
                    {game.secondaryCategories.map(cat => (
                      <span 
                        key={cat}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredGames.map(game => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{game.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                          {game.primaryCategory}
                        </span>
                        {game.secondaryCategories.map(cat => (
                          <span 
                            key={cat}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(game.rating) 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {game.isTrending && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        Trending
                      </span>
                    )}
                    {game.isNew && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}