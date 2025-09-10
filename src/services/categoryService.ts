import { supabase } from '@/lib/supabase';
import { Category, GameMetadata, CategoryWithGames, UserPreferences } from '@/types/category';

export class CategoryService {
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  }

  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return data;
  }

  static async getGamesByCategory(categoryId: string): Promise<GameMetadata[]> {
    const { data, error } = await supabase
      .from('game_metadata')
      .select('*')
      .eq('category_id', categoryId)
      .order('play_count', { ascending: false });

    if (error) {
      console.error('Error fetching games by category:', error);
      return [];
    }

    return data || [];
  }

  static async getCategoryWithGames(slug: string): Promise<CategoryWithGames | null> {
    const category = await this.getCategoryBySlug(slug);
    if (!category) return null;

    const games = await this.getGamesByCategory(category.id);
    
    return {
      ...category,
      games
    };
  }

  static async getAllGamesWithCategories(): Promise<GameMetadata[]> {
    const { data, error } = await supabase
      .from('game_metadata')
      .select(`
        *,
        category:categories(*)
      `)
      .order('play_count', { ascending: false });

    if (error) {
      console.error('Error fetching games with categories:', error);
      return [];
    }

    return data || [];
  }

  static async getFeaturedGames(): Promise<GameMetadata[]> {
    const { data, error } = await supabase
      .from('game_metadata')
      .select('*')
      .eq('featured', true)
      .order('play_count', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching featured games:', error);
      return [];
    }

    return data || [];
  }

  static async searchGames(query: string): Promise<GameMetadata[]> {
    const { data, error } = await supabase
      .from('game_metadata')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('play_count', { ascending: false });

    if (error) {
      console.error('Error searching games:', error);
      return [];
    }

    return data || [];
  }

  static async getGamesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<GameMetadata[]> {
    const { data, error } = await supabase
      .from('game_metadata')
      .select('*')
      .eq('difficulty', difficulty)
      .order('play_count', { ascending: false });

    if (error) {
      console.error('Error fetching games by difficulty:', error);
      return [];
    }

    return data || [];
  }

  static async getGamesByPlayTime(maxMinutes: number): Promise<GameMetadata[]> {
    const { data, error } = await supabase
      .from('game_metadata')
      .select('*')
      .lte('avg_play_time', maxMinutes)
      .order('play_count', { ascending: false });

    if (error) {
      console.error('Error fetching games by play time:', error);
      return [];
    }

    return data || [];
  }

  static async incrementPlayCount(gameSlug: string): Promise<void> {
    const { error } = await supabase.rpc('increment_play_count', { game_slug: gameSlug });

    if (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  static async recordGamePlay(userId: string, gameSlug: string, duration: number, score?: number, level?: number): Promise<void> {
    const { error } = await supabase
      .from('game_play_history')
      .insert({
        user_id: userId,
        game_slug: gameSlug,
        session_duration: duration,
        score,
        level_reached: level
      });

    if (error) {
      console.error('Error recording game play:', error);
    }
  }

  static async getRecentlyPlayedGames(userId: string, limit: number = 5): Promise<GameMetadata[]> {
    const { data: history, error: historyError } = await supabase
      .from('game_play_history')
      .select('game_slug')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (historyError || !history) {
      console.error('Error fetching play history:', historyError);
      return [];
    }

    const gameSlugs = [...new Set(history.map(h => h.game_slug))];
    
    const { data: games, error: gamesError } = await supabase
      .from('game_metadata')
      .select('*')
      .in('slug', gameSlugs);

    if (gamesError) {
      console.error('Error fetching recently played games:', gamesError);
      return [];
    }

    return games || [];
  }
}