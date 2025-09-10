import { CategoryService } from '@/services/categoryService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should fetch categories ordered by display_order', async () => {
      const mockCategories = [
        { id: '1', name: 'Puzzle', display_order: 1 },
        { id: '2', name: 'Action', display_order: 2 }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryService.getCategories();

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.order).toHaveBeenCalledWith('display_order', { ascending: true });
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryService.getCategories();
      expect(result).toEqual([]);
    });
  });

  describe('searchGames', () => {
    it('should search games by name, description, and tags', async () => {
      const mockGames = [
        { id: '1', name: 'Chess', description: 'Strategy game' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockGames, error: null })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryService.searchGames('chess');

      expect(supabase.from).toHaveBeenCalledWith('game_metadata');
      expect(mockChain.or).toHaveBeenCalledWith(
        'name.ilike.%chess%,description.ilike.%chess%,tags.cs.{chess}'
      );
      expect(result).toEqual(mockGames);
    });
  });

  describe('getGamesByDifficulty', () => {
    it('should fetch games filtered by difficulty', async () => {
      const mockGames = [
        { id: '1', name: 'Easy Game', difficulty: 'easy' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockGames, error: null })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryService.getGamesByDifficulty('easy');

      expect(mockChain.eq).toHaveBeenCalledWith('difficulty', 'easy');
      expect(result).toEqual(mockGames);
    });
  });

  describe('getGamesByPlayTime', () => {
    it('should fetch games with play time less than or equal to specified minutes', async () => {
      const mockGames = [
        { id: '1', name: 'Quick Game', avg_play_time: 5 }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockGames, error: null })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryService.getGamesByPlayTime(10);

      expect(mockChain.lte).toHaveBeenCalledWith('avg_play_time', 10);
      expect(result).toEqual(mockGames);
    });
  });

  describe('getFeaturedGames', () => {
    it('should fetch featured games limited to 8', async () => {
      const mockGames = [
        { id: '1', name: 'Featured Game', featured: true }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockGames, error: null })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryService.getFeaturedGames();

      expect(mockChain.eq).toHaveBeenCalledWith('featured', true);
      expect(mockChain.limit).toHaveBeenCalledWith(8);
      expect(result).toEqual(mockGames);
    });
  });
});