import { Metadata } from 'next'
import { SmartCategoryDiscovery } from '@/components/categories/SmartCategoryDiscovery'
import { CategoryRecommendationEngine } from '@/components/categories/CategoryRecommendationEngine'
import { TrendingGames } from '@/components/categories/TrendingGames'
import { CategoryMastery } from '@/components/categories/CategoryMastery'

export const metadata: Metadata = {
  title: 'Discover Games - Mini Games Platform',
  description: 'Discover new games with smart recommendations, trending games, and category exploration'
}

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Next Favorite Game</h1>
          <p className="text-xl text-white/90">
            Smart recommendations, trending games, and personalized discovery
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Trending & Mastery */}
          <div className="space-y-6">
            <TrendingGames />
            <CategoryMastery />
          </div>

          {/* Main Content - Discovery */}
          <div className="lg:col-span-2 space-y-8">
            {/* Smart Category Discovery */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Explore Games</h2>
              <SmartCategoryDiscovery />
            </div>

            {/* Recommendations */}
            <div className="mt-12">
              <CategoryRecommendationEngine 
                userHistory={[]}
                algorithm="hybrid"
                maxRecommendations={12}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}