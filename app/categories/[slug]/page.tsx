import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategoryById, GAME_CATEGORIES } from '../../../lib/data/gameMetadata'
import { GameCard } from '../../../components/GameCard'
import type { Metadata } from 'next'

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return GAME_CATEGORIES.map((category) => ({
    slug: category.slug,
  }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = getCategoryById(params.slug)
  
  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.name} - Mini Games`,
    description: category.description,
    openGraph: {
      title: `${category.name} - Mini Games`,
      description: category.description,
    },
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const category = getCategoryById(params.slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="container-responsive py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/#categories" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Categories
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 dark:text-white font-medium">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{category.icon}</span>
          <div>
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{category.games.length} games available</span>
          <span>•</span>
          <span>Various difficulty levels</span>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
          <option>All Difficulties</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        
        <select className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
          <option>Sort by: Popular</option>
          <option>Sort by: Name</option>
          <option>Sort by: Difficulty</option>
          <option>Sort by: Play Time</option>
        </select>
      </div>

      {/* Games Grid */}
      {category.games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {category.games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No games available in this category yet.</p>
        </div>
      )}

      {/* Related Categories */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Explore Other Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GAME_CATEGORIES.filter(cat => cat.id !== category.id)
            .slice(0, 4)
            .map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-2xl mb-2 block">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}