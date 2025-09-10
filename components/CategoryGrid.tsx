'use client'

import Link from 'next/link'
import { GAME_CATEGORIES } from '../lib/data/gameMetadata'
import type { GameCategory } from '../lib/types/categories'

interface CategoryGridProps {
  featured?: string[]
  searchQuery?: string
  isLoading?: boolean
}

export function CategoryGrid({ featured = [], searchQuery = '', isLoading = false }: CategoryGridProps) {
  // Filter categories based on search query
  const filteredCategories = searchQuery
    ? GAME_CATEGORIES.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : GAME_CATEGORIES

  // Show skeleton loader when loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            data-testid="category-skeleton"
            className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Show empty state when no categories match
  if (filteredCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No categories match your search</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCategories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isFeatured={featured.includes(category.id)}
        />
      ))}
    </div>
  )
}

interface CategoryCardProps {
  category: GameCategory
  isFeatured?: boolean
}

function CategoryCard({ category, isFeatured = false }: CategoryCardProps) {
  const colorClasses = {
    emerald: 'border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    purple: 'border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    red: 'border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    blue: 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    amber: 'border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20',
    cyan: 'border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
    pink: 'border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20',
    orange: 'border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    indigo: 'border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  }

  const borderColor = colorClasses[category.color as keyof typeof colorClasses] || colorClasses.blue

  return (
    <Link
      href={`/categories/${category.slug}`}
      aria-label={`Browse ${category.name}`}
    >
      <div
        data-category={category.id}
        data-testid={`category-${category.id}`}
        className={`
          relative p-6 rounded-lg border-2 ${borderColor}
          transition-transform hover:scale-105 cursor-pointer
          bg-white dark:bg-gray-800
          ${isFeatured ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
      >
        <div className="flex items-start justify-between mb-4">
          <span className="text-4xl" aria-hidden="true">{category.icon}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {category.games.length} games
          </span>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {category.description}
        </p>

        {isFeatured && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-xs rounded">
            Featured
          </span>
        )}
      </div>
    </Link>
  )
}