-- Create enum types for categories and difficulties
CREATE TYPE game_category AS ENUM (
  'puzzle', 'action', 'strategy', 'arcade', 'card', 
  'memory', 'skill', 'casino', 'word', 'music', 
  'physics', 'simulation'
);

CREATE TYPE game_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Create game_category_mappings table
-- This table stores the relationship between games and their categories with relevance scores
CREATE TABLE IF NOT EXISTS game_category_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id VARCHAR(255) NOT NULL,
  category game_category NOT NULL,
  relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure unique game-category pairs
  UNIQUE(game_id, category)
);

-- Create index for faster queries
CREATE INDEX idx_game_category_mappings_game_id ON game_category_mappings(game_id);
CREATE INDEX idx_game_category_mappings_category ON game_category_mappings(category);
CREATE INDEX idx_game_category_mappings_relevance ON game_category_mappings(relevance_score DESC);

-- Create category_analytics table
-- This table stores analytics data for each category
CREATE TABLE IF NOT EXISTS category_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id game_category NOT NULL,
  date DATE NOT NULL,
  plays INTEGER DEFAULT 0,
  unique_players INTEGER DEFAULT 0,
  avg_session_time DECIMAL(10, 2) DEFAULT 0, -- in minutes
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure unique category-date pairs for daily aggregation
  UNIQUE(category_id, date)
);

-- Create indexes for analytics queries
CREATE INDEX idx_category_analytics_category_date ON category_analytics(category_id, date DESC);
CREATE INDEX idx_category_analytics_date ON category_analytics(date DESC);

-- Create user_category_preferences table
-- This table stores user preferences and interaction history with categories
CREATE TABLE IF NOT EXISTS user_category_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id game_category NOT NULL,
  play_count INTEGER DEFAULT 0,
  favorite BOOLEAN DEFAULT FALSE,
  last_played TIMESTAMP WITH TIME ZONE,
  total_play_time INTEGER DEFAULT 0, -- in minutes
  avg_rating DECIMAL(3, 2), -- user's average rating for games in this category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure unique user-category pairs
  UNIQUE(user_id, category_id)
);

-- Create indexes for user preference queries
CREATE INDEX idx_user_category_preferences_user_id ON user_category_preferences(user_id);
CREATE INDEX idx_user_category_preferences_category ON user_category_preferences(category_id);
CREATE INDEX idx_user_category_preferences_favorite ON user_category_preferences(favorite) WHERE favorite = TRUE;
CREATE INDEX idx_user_category_preferences_play_count ON user_category_preferences(play_count DESC);

-- Create games table if it doesn't exist
-- This extends the basic game information with additional fields
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  path VARCHAR(255) NOT NULL,
  primary_category game_category NOT NULL,
  difficulty game_difficulty NOT NULL,
  avg_play_time INTEGER DEFAULT 0, -- in minutes
  rating DECIMAL(3, 2) DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  tags TEXT[], -- Array of tags
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure unique game paths
  UNIQUE(path)
);

-- Create indexes for game queries
CREATE INDEX idx_games_primary_category ON games(primary_category);
CREATE INDEX idx_games_difficulty ON games(difficulty);
CREATE INDEX idx_games_rating ON games(rating DESC);
CREATE INDEX idx_games_play_count ON games(play_count DESC);
CREATE INDEX idx_games_is_active ON games(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_game_category_mappings_updated_at 
  BEFORE UPDATE ON game_category_mappings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_analytics_updated_at 
  BEFORE UPDATE ON category_analytics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_category_preferences_updated_at 
  BEFORE UPDATE ON user_category_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at 
  BEFORE UPDATE ON games 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for category statistics
CREATE OR REPLACE VIEW category_statistics AS
SELECT 
  c.category_id,
  COUNT(DISTINCT gm.game_id) as game_count,
  SUM(ca.plays) as total_plays,
  SUM(ca.unique_players) as total_unique_players,
  AVG(ca.avg_session_time) as avg_session_time,
  AVG(ca.completion_rate) as avg_completion_rate,
  COUNT(DISTINCT ucp.user_id) as users_with_preference,
  COUNT(DISTINCT CASE WHEN ucp.favorite = TRUE THEN ucp.user_id END) as users_favorited
FROM 
  (SELECT DISTINCT unnest(enum_range(NULL::game_category)) as category_id) c
  LEFT JOIN game_category_mappings gm ON c.category_id = gm.category
  LEFT JOIN category_analytics ca ON c.category_id = ca.category_id
  LEFT JOIN user_category_preferences ucp ON c.category_id = ucp.category_id
GROUP BY c.category_id;

-- Create function to get games by multiple categories with AND/OR logic
CREATE OR REPLACE FUNCTION get_games_by_categories(
  p_categories game_category[],
  p_logic VARCHAR DEFAULT 'OR',
  p_min_relevance INTEGER DEFAULT 0
)
RETURNS TABLE (
  game_id VARCHAR(255),
  categories game_category[],
  relevance_scores INTEGER[]
)
AS $$
BEGIN
  IF p_logic = 'OR' THEN
    RETURN QUERY
    SELECT 
      gcm.game_id,
      ARRAY_AGG(gcm.category) as categories,
      ARRAY_AGG(gcm.relevance_score) as relevance_scores
    FROM game_category_mappings gcm
    WHERE 
      gcm.category = ANY(p_categories)
      AND gcm.relevance_score >= p_min_relevance
    GROUP BY gcm.game_id;
  ELSE -- AND logic
    RETURN QUERY
    SELECT 
      gcm.game_id,
      ARRAY_AGG(gcm.category) as categories,
      ARRAY_AGG(gcm.relevance_score) as relevance_scores
    FROM game_category_mappings gcm
    WHERE gcm.relevance_score >= p_min_relevance
    GROUP BY gcm.game_id
    HAVING ARRAY_AGG(gcm.category) @> p_categories;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update category analytics
CREATE OR REPLACE FUNCTION update_category_analytics(
  p_category game_category,
  p_date DATE,
  p_plays INTEGER DEFAULT 0,
  p_unique_players INTEGER DEFAULT 0,
  p_avg_session_time DECIMAL DEFAULT 0,
  p_completion_rate DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO category_analytics (
    category_id, 
    date, 
    plays, 
    unique_players, 
    avg_session_time, 
    completion_rate
  )
  VALUES (
    p_category, 
    p_date, 
    p_plays, 
    p_unique_players, 
    p_avg_session_time, 
    p_completion_rate
  )
  ON CONFLICT (category_id, date) 
  DO UPDATE SET
    plays = category_analytics.plays + EXCLUDED.plays,
    unique_players = GREATEST(category_analytics.unique_players, EXCLUDED.unique_players),
    avg_session_time = (category_analytics.avg_session_time + EXCLUDED.avg_session_time) / 2,
    completion_rate = (category_analytics.completion_rate + EXCLUDED.completion_rate) / 2,
    updated_at = TIMEZONE('utc', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create function to update user category preferences
CREATE OR REPLACE FUNCTION update_user_category_preference(
  p_user_id UUID,
  p_category game_category,
  p_play_time INTEGER DEFAULT 0,
  p_rating DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_category_preferences (
    user_id,
    category_id,
    play_count,
    last_played,
    total_play_time,
    avg_rating
  )
  VALUES (
    p_user_id,
    p_category,
    1,
    TIMEZONE('utc', NOW()),
    p_play_time,
    p_rating
  )
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET
    play_count = user_category_preferences.play_count + 1,
    last_played = TIMEZONE('utc', NOW()),
    total_play_time = user_category_preferences.total_play_time + p_play_time,
    avg_rating = CASE 
      WHEN p_rating IS NOT NULL THEN
        COALESCE((user_category_preferences.avg_rating * user_category_preferences.play_count + p_rating) / (user_category_preferences.play_count + 1), p_rating)
      ELSE
        user_category_preferences.avg_rating
    END,
    updated_at = TIMEZONE('utc', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for security
ALTER TABLE game_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Public read access for game_category_mappings
CREATE POLICY "Public read access for game_category_mappings" 
  ON game_category_mappings FOR SELECT 
  USING (true);

-- Admin write access for game_category_mappings
CREATE POLICY "Admin write access for game_category_mappings" 
  ON game_category_mappings FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Public read access for category_analytics
CREATE POLICY "Public read access for category_analytics" 
  ON category_analytics FOR SELECT 
  USING (true);

-- Admin write access for category_analytics
CREATE POLICY "Admin write access for category_analytics" 
  ON category_analytics FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can read and write their own preferences
CREATE POLICY "Users can manage their own preferences" 
  ON user_category_preferences FOR ALL 
  USING (auth.uid() = user_id);

-- Public read access for games
CREATE POLICY "Public read access for games" 
  ON games FOR SELECT 
  USING (is_active = true);

-- Admin write access for games
CREATE POLICY "Admin write access for games" 
  ON games FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;