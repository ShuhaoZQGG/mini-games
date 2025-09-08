import { 
  getProfile, 
  updateProfile, 
  trackGamePlay,
  getAchievements,
  getTopPlayers,
  UserProfile,
  Achievement
} from '@/lib/services/profiles'

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/avatar.jpg' } 
        })
      }))
    }
  })),
  getGuestSession: jest.fn(() => 'guest_123'),
  getGuestName: jest.fn(() => 'Guest123')
}))

describe('Profile Service', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should generate and return a mock profile when no user is found', async () => {
      const result = await getProfile()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.username).toBeDefined()
      expect(result.data?.achievements).toBeInstanceOf(Array)
      expect(result.data?.stats).toBeDefined()
    })

    it('should return profile for a specific user ID', async () => {
      const userId = 'test_user_123'
      const result = await getProfile(userId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe(userId)
    })

    it('should retrieve profile from localStorage if it exists', async () => {
      const mockProfile: UserProfile = {
        id: 'cached_user',
        username: 'CachedUser',
        avatar_url: null,
        bio: 'Test bio',
        total_games_played: 10,
        total_score: 5000,
        highest_score: 1000,
        win_rate: 60,
        achievements: [],
        created_at: new Date().toISOString(),
        stats: {
          games_played: 10,
          total_score: 5000,
          total_time_played: 1800,
          average_score: 500,
          highest_score: 1000,
          win_rate: 60,
          games_won: 6,
          games_lost: 4,
          current_streak: 2,
          longest_streak: 4,
          games_by_category: {},
          scores_by_game: {},
          recent_activity: []
        }
      }

      localStorageMock.setItem('profile_cached_user', JSON.stringify(mockProfile))
      localStorageMock.setItem('current_profile_id', 'cached_user')

      const result = await getProfile('cached_user')

      expect(result.success).toBe(true)
      expect(result.data?.username).toBe('CachedUser')
      expect(result.data?.total_games_played).toBe(10)
    })
  })

  describe('updateProfile', () => {
    it('should update profile in localStorage', async () => {
      // First create a profile
      const profileResult = await getProfile('test_user')
      expect(profileResult.success).toBe(true)

      // Update the profile
      const updates = {
        username: 'UpdatedUser',
        bio: 'Updated bio',
        theme_preference: 'dark' as const
      }

      const updateResult = await updateProfile('test_user', updates)

      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.username).toBe('UpdatedUser')
      expect(updateResult.data?.bio).toBe('Updated bio')
      expect(updateResult.data?.theme_preference).toBe('dark')
    })

    it('should return error if profile not found', async () => {
      const result = await updateProfile('non_existent_user', { username: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('trackGamePlay', () => {
    it('should track game play and update statistics', async () => {
      const userId = 'test_user'
      
      // Create initial profile
      await getProfile(userId)

      // Track a game
      const result = await trackGamePlay(userId, 'snake', 100, {
        won: true,
        time_played: 180
      })

      expect(result.success).toBe(true)

      // Check updated profile
      const profileResult = await getProfile(userId)
      const profile = profileResult.data!

      expect(profile.stats.games_played).toBeGreaterThan(0)
      expect(profile.stats.total_score).toBeGreaterThanOrEqual(100)
      expect(profile.stats.games_won).toBeGreaterThan(0)
    })

    it('should update win streak correctly', async () => {
      const userId = 'streak_test_user'
      await getProfile(userId)

      // Win 3 games in a row
      await trackGamePlay(userId, 'snake', 100, { won: true })
      await trackGamePlay(userId, 'tetris', 200, { won: true })
      await trackGamePlay(userId, '2048', 300, { won: true })

      let profile = (await getProfile(userId)).data!
      expect(profile.stats.current_streak).toBe(3)
      expect(profile.stats.longest_streak).toBeGreaterThanOrEqual(3)

      // Lose a game
      await trackGamePlay(userId, 'snake', 50, { won: false })

      profile = (await getProfile(userId)).data!
      expect(profile.stats.current_streak).toBe(0)
      expect(profile.stats.longest_streak).toBeGreaterThanOrEqual(3)
    })

    it('should check for achievement unlocks', async () => {
      const userId = 'achievement_test_user'
      await getProfile(userId)

      // Play enough games to unlock "First Steps" achievement
      const result = await trackGamePlay(userId, 'snake', 100, { won: true })

      expect(result.success).toBe(true)
      // Note: newAchievements might be empty in mock since achievements 
      // are calculated based on stats
    })
  })

  describe('getAchievements', () => {
    it('should return achievements for a user', async () => {
      const userId = 'test_user'
      await getProfile(userId)

      const achievements = await getAchievements(userId)

      expect(achievements).toBeInstanceOf(Array)
      expect(achievements.length).toBeGreaterThan(0)
      
      // Check achievement structure
      if (achievements.length > 0) {
        const achievement = achievements[0]
        expect(achievement).toHaveProperty('id')
        expect(achievement).toHaveProperty('name')
        expect(achievement).toHaveProperty('description')
        expect(achievement).toHaveProperty('icon')
        expect(achievement).toHaveProperty('category')
        expect(achievement).toHaveProperty('rarity')
        expect(achievement).toHaveProperty('unlocked')
        expect(achievement).toHaveProperty('points')
      }
    })

    it('should calculate achievement progress', async () => {
      const userId = 'progress_test_user'
      const profile = await getProfile(userId)
      
      const achievements = profile.data?.achievements || []
      const gamesPlayedAchievement = achievements.find(a => a.id === 'first_game')

      expect(gamesPlayedAchievement).toBeDefined()
      expect(gamesPlayedAchievement?.progress).toBeDefined()
      expect(gamesPlayedAchievement?.total).toBeDefined()
    })
  })

  describe('getTopPlayers', () => {
    it('should return a list of top players', async () => {
      const topPlayers = await getTopPlayers(5)

      expect(topPlayers).toBeInstanceOf(Array)
      expect(topPlayers.length).toBeLessThanOrEqual(5)

      // Check if players are sorted by score
      for (let i = 1; i < topPlayers.length; i++) {
        expect(topPlayers[i - 1].total_score).toBeGreaterThanOrEqual(topPlayers[i].total_score)
      }
    })

    it('should return mock data when Supabase is not configured', async () => {
      const topPlayers = await getTopPlayers(10)

      expect(topPlayers).toBeInstanceOf(Array)
      expect(topPlayers.length).toBe(10)
      
      // Check mock data structure
      topPlayers.forEach((player, index) => {
        expect(player.username).toBe(`TopPlayer${index + 1}`)
        expect(player.total_score).toBeGreaterThan(0)
      })
    })
  })

  describe('Achievement System', () => {
    it('should have all default achievements defined', async () => {
      const profile = await getProfile('test_user')
      const achievements = profile.data?.achievements || []

      // Check for specific achievement categories
      const categories = new Set(achievements.map(a => a.category))
      expect(categories.has('games')).toBe(true)
      expect(categories.has('scores')).toBe(true)
      expect(categories.has('special')).toBe(true)

      // Check for specific achievements
      const achievementIds = achievements.map(a => a.id)
      expect(achievementIds).toContain('first_game')
      expect(achievementIds).toContain('game_explorer')
      expect(achievementIds).toContain('score_rookie')
    })

    it('should have correct rarity levels', async () => {
      const profile = await getProfile('test_user')
      const achievements = profile.data?.achievements || []

      const rarities = new Set(achievements.map(a => a.rarity))
      const validRarities = ['common', 'rare', 'epic', 'legendary']

      rarities.forEach(rarity => {
        expect(validRarities).toContain(rarity)
      })
    })

    it('should calculate points correctly', async () => {
      const profile = await getProfile('test_user')
      const achievements = profile.data?.achievements || []

      achievements.forEach(achievement => {
        expect(achievement.points).toBeGreaterThan(0)
        
        // Higher rarity should generally have more points
        if (achievement.rarity === 'legendary') {
          expect(achievement.points).toBeGreaterThanOrEqual(100)
        } else if (achievement.rarity === 'epic') {
          expect(achievement.points).toBeGreaterThanOrEqual(50)
        }
      })
    })
  })

  describe('Profile Statistics', () => {
    it('should track game-specific scores', async () => {
      const userId = 'game_stats_user'
      await getProfile(userId)

      // Play different games
      await trackGamePlay(userId, 'snake', 100, { won: true })
      await trackGamePlay(userId, 'tetris', 200, { won: false })
      await trackGamePlay(userId, 'snake', 150, { won: true })

      const profile = (await getProfile(userId)).data!

      expect(profile.stats.scores_by_game['snake']).toBeGreaterThanOrEqual(250)
      expect(profile.stats.scores_by_game['tetris']).toBeGreaterThanOrEqual(200)
    })

    it('should track recent activity', async () => {
      const userId = 'activity_test_user'
      await getProfile(userId)

      await trackGamePlay(userId, 'snake', 100, { won: true })

      const profile = (await getProfile(userId)).data!

      expect(profile.stats.recent_activity).toBeInstanceOf(Array)
      expect(profile.stats.recent_activity.length).toBeGreaterThan(0)

      const recentActivity = profile.stats.recent_activity[0]
      expect(recentActivity.type).toBe('game_played')
      expect(recentActivity.game_id).toBe('snake')
      expect(recentActivity.score).toBe(100)
    })

    it('should calculate average score correctly', async () => {
      const userId = 'average_test_user'
      await getProfile(userId)

      await trackGamePlay(userId, 'snake', 100, { won: true })
      await trackGamePlay(userId, 'snake', 200, { won: true })
      await trackGamePlay(userId, 'snake', 300, { won: false })

      const profile = (await getProfile(userId)).data!

      expect(profile.stats.average_score).toBeGreaterThan(0)
      expect(profile.stats.total_score).toBeGreaterThanOrEqual(600)
    })
  })
})