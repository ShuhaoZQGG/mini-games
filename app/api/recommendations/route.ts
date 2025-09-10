import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { recommendations } from '@/lib/recommendations'
import { userPreferences } from '@/lib/userPreferences'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'personalized'
    const limit = parseInt(searchParams.get('limit') || '10')
    const gameId = searchParams.get('gameId')

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    // Initialize user preferences
    await userPreferences.initialize(session?.user?.id)

    let result: any

    switch (type) {
      case 'personalized':
        result = recommendations.getRecommendations(limit)
        break
      
      case 'similar':
        if (!gameId) {
          return NextResponse.json(
            { error: 'gameId required for similar games' },
            { status: 400 }
          )
        }
        result = recommendations.getSimilarGames(gameId, limit)
        break
      
      case 'trending':
        result = recommendations.getTrendingGames(limit)
        break
      
      case 'daily':
        result = recommendations.getDailyChallenges()
        break
      
      case 'categories':
        result = recommendations.getPersonalizedCategories()
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}