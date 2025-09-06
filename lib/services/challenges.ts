/**
 * Challenge System Service
 * Manages game challenges between friends
 */

import { createClient } from '@/lib/supabase/client'
import { friendService } from './friends'

// Create supabase client - will be null if not configured
const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null

export interface Challenge {
  id: string
  fromUserId: string
  fromUsername: string
  fromAvatarUrl?: string
  toUserId: string
  toUsername: string
  toAvatarUrl?: string
  gameSlug: string
  gameTitle: string
  challengeType: 'score' | 'time' | 'accuracy' | 'custom'
  targetScore?: number
  targetTime?: number
  targetAccuracy?: number
  customTarget?: string
  message?: string
  status: 'pending' | 'accepted' | 'completed' | 'expired' | 'declined'
  createdAt: Date
  expiresAt: Date
  completedAt?: Date
  results?: ChallengeResult[]
}

export interface ChallengeResult {
  userId: string
  username: string
  score?: number
  time?: number
  accuracy?: number
  completedAt: Date
  isWinner?: boolean
}

export interface ChallengeStats {
  totalChallenges: number
  wonChallenges: number
  lostChallenges: number
  pendingChallenges: number
  winRate: number
  favoriteOpponent?: string
  favoriteGame?: string
}

class ChallengeService {
  private challenges: Map<string, Challenge> = new Map()
  private currentUserId: string | null = null

  /**
   * Initialize challenge service for a user
   */
  async initialize(userId: string) {
    this.currentUserId = userId
    await this.loadChallenges()
  }

  /**
   * Create a new challenge
   */
  async createChallenge(params: {
    toUsername: string
    gameSlug: string
    gameTitle: string
    challengeType: Challenge['challengeType']
    targetScore?: number
    targetTime?: number
    targetAccuracy?: number
    customTarget?: string
    message?: string
    expiresInHours?: number
  }): Promise<Challenge | null> {
    try {
      // Check if users are friends
      const friends = await friendService.getFriends()
      const friend = friends.find(f => f.username === params.toUsername)
      
      if (!friend) {
        throw new Error('You can only challenge friends')
      }

      const challenge: Challenge = {
        id: `challenge_${Date.now()}`,
        fromUserId: this.currentUserId || 'user_1',
        fromUsername: 'You',
        toUserId: friend.id,
        toUsername: friend.username,
        toAvatarUrl: friend.avatarUrl,
        gameSlug: params.gameSlug,
        gameTitle: params.gameTitle,
        challengeType: params.challengeType,
        targetScore: params.targetScore,
        targetTime: params.targetTime,
        targetAccuracy: params.targetAccuracy,
        customTarget: params.customTarget,
        message: params.message,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (params.expiresInHours || 24) * 60 * 60 * 1000),
        results: []
      }

      if (supabase) {
        const { data, error } = await (supabase
          .from('challenges') as any)
          .insert(challenge)
          .select()
          .single()

        if (!error && data) {
          const challenge = data as any
          this.challenges.set(challenge.id, challenge)
          this.saveToStorage()
          return challenge as Challenge
        }
      }

      // Fallback to local storage
      this.challenges.set(challenge.id, challenge)
      this.saveToStorage()
      return challenge
    } catch (error) {
      console.error('Failed to create challenge:', error)
      return null
    }
  }

  /**
   * Accept a challenge
   */
  async acceptChallenge(challengeId: string): Promise<boolean> {
    try {
      const challenge = this.challenges.get(challengeId)
      if (!challenge) return false

      challenge.status = 'accepted'

      if (supabase) {
        const { error } = await (supabase
          .from('challenges') as any)
          .update({ status: 'accepted' })
          .eq('id', challengeId)

        if (error) throw error
      }

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to accept challenge:', error)
      return false
    }
  }

  /**
   * Decline a challenge
   */
  async declineChallenge(challengeId: string): Promise<boolean> {
    try {
      const challenge = this.challenges.get(challengeId)
      if (!challenge) return false

      challenge.status = 'declined'

      if (supabase) {
        const { error } = await (supabase
          .from('challenges') as any)
          .update({ status: 'declined' })
          .eq('id', challengeId)

        if (error) throw error
      }

      this.challenges.delete(challengeId)
      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to decline challenge:', error)
      return false
    }
  }

  /**
   * Submit challenge result
   */
  async submitResult(challengeId: string, result: {
    score?: number
    time?: number
    accuracy?: number
  }): Promise<boolean> {
    try {
      const challenge = this.challenges.get(challengeId)
      if (!challenge || challenge.status !== 'accepted') return false

      const userResult: ChallengeResult = {
        userId: this.currentUserId || 'user_1',
        username: challenge.fromUserId === this.currentUserId ? challenge.fromUsername : challenge.toUsername,
        score: result.score,
        time: result.time,
        accuracy: result.accuracy,
        completedAt: new Date()
      }

      if (!challenge.results) {
        challenge.results = []
      }
      challenge.results.push(userResult)

      // Check if both players have completed
      if (challenge.results.length === 2) {
        challenge.status = 'completed'
        challenge.completedAt = new Date()
        
        // Determine winner
        const [result1, result2] = challenge.results
        if (challenge.challengeType === 'score') {
          result1.isWinner = (result1.score || 0) > (result2.score || 0)
          result2.isWinner = !result1.isWinner
        } else if (challenge.challengeType === 'time') {
          result1.isWinner = (result1.time || Infinity) < (result2.time || Infinity)
          result2.isWinner = !result1.isWinner
        } else if (challenge.challengeType === 'accuracy') {
          result1.isWinner = (result1.accuracy || 0) > (result2.accuracy || 0)
          result2.isWinner = !result1.isWinner
        }
      }

      if (supabase) {
        const { error } = await (supabase
          .from('challenges') as any)
          .update({
            results: challenge.results,
            status: challenge.status,
            completedAt: challenge.completedAt
          })
          .eq('id', challengeId)

        if (error) throw error
      }

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to submit challenge result:', error)
      return false
    }
  }

  /**
   * Get all challenges
   */
  async getChallenges(filter?: 'sent' | 'received' | 'pending' | 'completed'): Promise<Challenge[]> {
    try {
      if (supabase) {
        let query = (supabase.from('challenges') as any).select('*')
        
        if (filter === 'sent') {
          query = query.eq('from_user_id', this.currentUserId || '')
        } else if (filter === 'received') {
          query = query.eq('to_user_id', this.currentUserId || '')
        } else if (filter === 'pending') {
          query = query.eq('status', 'pending')
        } else if (filter === 'completed') {
          query = query.eq('status', 'completed')
        } else {
          query = query.or(`from_user_id.eq.${this.currentUserId || ''},to_user_id.eq.${this.currentUserId || ''}`)
        }

        const { data, error } = await query

        if (!error && data) {
          this.challenges.clear()
          data.forEach((challenge: any) => {
            challenge.createdAt = new Date(challenge.created_at)
            challenge.expiresAt = new Date(challenge.expires_at)
            if (challenge.completedAt) {
              challenge.completedAt = new Date(challenge.completed_at)
            }
            this.challenges.set(challenge.id, challenge)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load challenges:', error)
    }

    // Filter based on request
    let challenges = Array.from(this.challenges.values())
    
    if (filter === 'sent') {
      challenges = challenges.filter(c => c.fromUserId === this.currentUserId)
    } else if (filter === 'received') {
      challenges = challenges.filter(c => c.toUserId === this.currentUserId)
    } else if (filter === 'pending') {
      challenges = challenges.filter(c => c.status === 'pending')
    } else if (filter === 'completed') {
      challenges = challenges.filter(c => c.status === 'completed')
    }

    // Check for expired challenges
    const now = new Date()
    challenges.forEach(challenge => {
      if (challenge.status === 'pending' && challenge.expiresAt < now) {
        challenge.status = 'expired'
      }
    })

    return challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Get challenge statistics
   */
  async getChallengeStats(): Promise<ChallengeStats> {
    const challenges = await this.getChallenges()
    const completedChallenges = challenges.filter(c => c.status === 'completed')
    
    let wonChallenges = 0
    let lostChallenges = 0
    const opponentCounts: Record<string, number> = {}
    const gameCounts: Record<string, number> = {}

    completedChallenges.forEach(challenge => {
      const userResult = challenge.results?.find(r => r.userId === this.currentUserId)
      if (userResult?.isWinner) {
        wonChallenges++
      } else if (userResult && !userResult.isWinner) {
        lostChallenges++
      }

      const opponentId = challenge.fromUserId === this.currentUserId ? challenge.toUserId : challenge.fromUserId
      opponentCounts[opponentId] = (opponentCounts[opponentId] || 0) + 1
      gameCounts[challenge.gameSlug] = (gameCounts[challenge.gameSlug] || 0) + 1
    })

    const favoriteOpponent = Object.entries(opponentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]

    const favoriteGame = Object.entries(gameCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]

    return {
      totalChallenges: challenges.length,
      wonChallenges,
      lostChallenges,
      pendingChallenges: challenges.filter(c => c.status === 'pending').length,
      winRate: completedChallenges.length > 0 ? (wonChallenges / completedChallenges.length) * 100 : 0,
      favoriteOpponent,
      favoriteGame
    }
  }

  /**
   * Get active challenge for a game
   */
  async getActiveChallenge(gameSlug: string): Promise<Challenge | null> {
    const challenges = await this.getChallenges()
    return challenges.find(c => 
      c.gameSlug === gameSlug && 
      c.status === 'accepted' &&
      (c.results?.length || 0) < 2
    ) || null
  }

  /**
   * Load challenges from storage
   */
  private async loadChallenges() {
    try {
      const stored = localStorage.getItem('challenges')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.forEach((challenge: any) => {
          challenge.createdAt = new Date(challenge.createdAt)
          challenge.expiresAt = new Date(challenge.expiresAt)
          if (challenge.completedAt) {
            challenge.completedAt = new Date(challenge.completedAt)
          }
          if (challenge.results) {
            challenge.results.forEach((result: any) => {
              result.completedAt = new Date(result.completedAt)
            })
          }
          this.challenges.set(challenge.id, challenge)
        })
      } else {
        // Load mock challenges for demo
        this.loadMockChallenges()
      }
    } catch (error) {
      console.error('Failed to load challenges from storage:', error)
    }
  }

  /**
   * Load mock challenges for demo
   */
  private loadMockChallenges() {
    const mockChallenges: Challenge[] = [
      {
        id: 'challenge_1',
        fromUserId: 'friend_1',
        fromUsername: 'ProGamer123',
        toUserId: this.currentUserId || 'user_1',
        toUsername: 'You',
        gameSlug: 'cps-test',
        gameTitle: 'CPS Test',
        challengeType: 'score',
        targetScore: 10,
        message: 'Beat my CPS score!',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000)
      },
      {
        id: 'challenge_2',
        fromUserId: this.currentUserId || 'user_1',
        fromUsername: 'You',
        toUserId: 'friend_2',
        toUsername: 'SpeedRunner',
        gameSlug: 'typing-test',
        gameTitle: 'Typing Test',
        challengeType: 'score',
        targetScore: 80,
        status: 'completed',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        results: [
          {
            userId: this.currentUserId || 'user_1',
            username: 'You',
            score: 85,
            completedAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
            isWinner: true
          },
          {
            userId: 'friend_2',
            username: 'SpeedRunner',
            score: 78,
            completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            isWinner: false
          }
        ]
      }
    ]

    mockChallenges.forEach(challenge => this.challenges.set(challenge.id, challenge))
  }

  /**
   * Save challenges to localStorage
   */
  private saveToStorage() {
    try {
      const challenges = Array.from(this.challenges.values())
      localStorage.setItem('challenges', JSON.stringify(challenges))
    } catch (error) {
      console.error('Failed to save challenges to storage:', error)
    }
  }
}

// Export singleton instance
export const challengeService = new ChallengeService()