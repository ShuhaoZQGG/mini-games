export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  display_order?: number;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GameMetadata {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  avg_play_time: number; // in minutes
  player_count: string;
  thumbnail_url?: string;
  description: string;
  play_count: number;
  rating?: number;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  user_id: string;
  favorite_games: string[];
  preferred_categories: string[];
  last_played_games: Record<string, any>;
  play_statistics: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface GamePlayHistory {
  id: string;
  user_id: string;
  game_slug: string;
  session_duration: number; // in seconds
  score?: number;
  level_reached?: number;
  played_at: string;
}

export interface CategoryWithGames extends Category {
  games: GameMetadata[];
}