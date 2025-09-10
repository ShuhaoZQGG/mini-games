import { games } from './games'
import { gameCategories } from './gameCategories'
import { userPreferences } from './userPreferences'

export interface GameRecommendation {
  gameId: string
  score: number
  reason: string
}

class RecommendationEngine {
  private getCategoryForGame(gameId: string): string | null {
    const game = gameCategories.find(g => g.id === gameId)
    return game ? game.category : null
  }

  private getGamesInCategory(category: string): string[] {
    return gameCategories
      .filter(game => game.category === category)
      .map(game => game.id)
  }

  private calculateSimilarityScore(game1: string, game2: string): number {
    const cat1 = this.getCategoryForGame(game1)
    const cat2 = this.getCategoryForGame(game2)
    
    if (!cat1 || !cat2) return 0
    
    // Same category gets high score
    if (cat1 === cat2) return 0.8
    
    // Related categories get medium score
    const relatedCategories: Record<string, string[]> = {
      'puzzle': ['strategy', 'memory', 'word'],
      'strategy': ['puzzle', 'card'],
      'arcade': ['action', 'skill'],
      'action': ['arcade', 'skill'],
      'skill': ['action', 'arcade'],
      'memory': ['puzzle', 'word'],
      'card': ['strategy', 'casino'],
      'casino': ['card'],
      'word': ['puzzle', 'memory']
    }
    
    if (relatedCategories[cat1]?.includes(cat2)) return 0.5
    
    return 0.2
  }

  getRecommendations(limit = 10): GameRecommendation[] {
    const prefs = userPreferences.getPreferences()
    const recommendations: Map<string, GameRecommendation> = new Map()
    
    // Get user's play history and favorites
    const recentlyPlayed = userPreferences.getRecentlyPlayedGames(10)
    const mostPlayed = userPreferences.getMostPlayedGames(10)
    const favorites = prefs.favoriteGames
    
    // Calculate scores for all games
    games.forEach(game => {
      if (recentlyPlayed.includes(game.id)) return // Don't recommend recently played
      
      let score = 0
      let reasons: string[] = []
      
      // Based on favorites
      favorites.forEach(favId => {
        const similarity = this.calculateSimilarityScore(game.id, favId)
        if (similarity > 0) {
          score += similarity * 2
          const favGame = games.find(g => g.id === favId)
          if (similarity > 0.7) {
            reasons.push(`Because you like ${favGame?.name}`)
          }
        }
      })
      
      // Based on most played games
      mostPlayed.forEach(({ gameId, count }) => {
        const similarity = this.calculateSimilarityScore(game.id, gameId)
        if (similarity > 0) {
          score += similarity * (1 + count * 0.1)
          if (similarity > 0.7 && count > 5) {
            const playedGame = games.find(g => g.id === gameId)
            reasons.push(`Similar to ${playedGame?.name} which you play often`)
          }
        }
      })
      
      // Based on category preferences
      const category = this.getCategoryForGame(game.id)
      if (category) {
        const categoryGames = this.getGamesInCategory(category)
        const playedInCategory = recentlyPlayed.filter(id => categoryGames.includes(id))
        if (playedInCategory.length > 0) {
          score += 0.5 * playedInCategory.length
          if (playedInCategory.length > 2) {
            reasons.push(`Popular in ${category} games`)
          }
        }
      }
      
      // Boost new or less played games slightly
      const playCount = prefs.playHistory.filter(h => h.gameId === game.id).length
      if (playCount === 0) {
        score += 0.3
        if (score > 1) {
          reasons.push('New game to try')
        }
      } else if (playCount < 3) {
        score += 0.2
      }
      
      // Popular games get a small boost
      if (game.id === 'cps-test' || game.id === 'typing-test' || game.id === '2048') {
        score += 0.2
        if (score > 0.5 && reasons.length === 0) {
          reasons.push('Popular game')
        }
      }
      
      if (score > 0) {
        recommendations.set(game.id, {
          gameId: game.id,
          score,
          reason: reasons[0] || 'Recommended for you'
        })
      }
    })
    
    // Sort by score and return top N
    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  getPersonalizedCategories(): string[] {
    const prefs = userPreferences.getPreferences()
    const categoryScores: Map<string, number> = new Map()
    
    // Count plays per category
    prefs.playHistory.forEach(entry => {
      const category = this.getCategoryForGame(entry.gameId)
      if (category) {
        categoryScores.set(category, (categoryScores.get(category) || 0) + 1)
      }
    })
    
    // Add favorite games' categories
    prefs.favoriteGames.forEach(gameId => {
      const category = this.getCategoryForGame(gameId)
      if (category) {
        categoryScores.set(category, (categoryScores.get(category) || 0) + 3)
      }
    })
    
    // Sort categories by score
    const sortedCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)
    
    // Add remaining categories
    const allCategories = ['puzzle', 'action', 'strategy', 'arcade', 'card', 'memory', 'skill', 'casino', 'word']
    allCategories.forEach(cat => {
      if (!sortedCategories.includes(cat)) {
        sortedCategories.push(cat)
      }
    })
    
    return sortedCategories
  }

  getSimilarGames(gameId: string, limit = 5): string[] {
    const category = this.getCategoryForGame(gameId)
    if (!category) return []
    
    const sameCategory = this.getGamesInCategory(category)
      .filter(id => id !== gameId)
    
    const scores: Map<string, number> = new Map()
    
    sameCategory.forEach(id => {
      scores.set(id, 1)
    })
    
    // Add games from related categories
    const relatedCategories: Record<string, string[]> = {
      'puzzle': ['strategy', 'memory', 'word'],
      'strategy': ['puzzle', 'card'],
      'arcade': ['action', 'skill'],
      'action': ['arcade', 'skill'],
      'skill': ['action', 'arcade'],
      'memory': ['puzzle', 'word'],
      'card': ['strategy', 'casino'],
      'casino': ['card'],
      'word': ['puzzle', 'memory']
    }
    
    const related = relatedCategories[category] || []
    related.forEach(relCat => {
      this.getGamesInCategory(relCat).forEach(id => {
        if (id !== gameId) {
          scores.set(id, (scores.get(id) || 0) + 0.5)
        }
      })
    })
    
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)
  }

  getTrendingGames(limit = 5): string[] {
    // In a real app, this would fetch from analytics
    // For now, return popular games
    const trending = [
      'cps-test',
      'typing-test',
      '2048',
      'snake',
      'tetris',
      'wordle',
      'chess',
      'sudoku',
      'minesweeper',
      'pac-man'
    ]
    
    return trending.slice(0, limit)
  }

  getDailyChallenges(): Array<{ gameId: string; challenge: string }> {
    const today = new Date().toISOString().split('T')[0]
    const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0)
    
    // Deterministic pseudo-random selection based on date
    const allGames = [...games]
    const challenges: Array<{ gameId: string; challenge: string }> = []
    
    // Pick 3 games for daily challenges
    for (let i = 0; i < 3; i++) {
      const index = (seed * (i + 1)) % allGames.length
      const game = allGames[index]
      
      const challengeTypes = [
        'Beat the average score',
        'Complete in under 2 minutes',
        'Achieve a perfect game',
        'Beat your personal best',
        'Complete without mistakes'
      ]
      
      const challengeIndex = (seed + i) % challengeTypes.length
      
      challenges.push({
        gameId: game.id,
        challenge: challengeTypes[challengeIndex]
      })
    }
    
    return challenges
  }
}

export const recommendations = new RecommendationEngine()