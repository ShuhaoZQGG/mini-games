-- Enhanced Category Features Migration
-- Adds support for category views, game ratings, featured games, and quick play sessions

-- Category Views Tracking
CREATE TABLE IF NOT EXISTS category_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent INTEGER, -- seconds
  games_viewed JSONB DEFAULT '[]'::jsonb, -- array of game IDs viewed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_category_views_category_id ON category_views(category_id);
CREATE INDEX IF NOT EXISTS idx_category_views_user_id ON category_views(user_id);
CREATE INDEX IF NOT EXISTS idx_category_views_viewed_at ON category_views(viewed_at DESC);

-- Game Ratings with Reviews
CREATE TABLE IF NOT EXISTS game_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Create indexes for game ratings
CREATE INDEX IF NOT EXISTS idx_game_ratings_game_id ON game_ratings(game_id);
CREATE INDEX IF NOT EXISTS idx_game_ratings_user_id ON game_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_ratings_rating ON game_ratings(rating DESC);

-- Featured Games Management
CREATE TABLE IF NOT EXISTS featured_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR(50) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  featured_until TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, category_id)
);

-- Create indexes for featured games
CREATE INDEX IF NOT EXISTS idx_featured_games_category_id ON featured_games(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_games_active ON featured_games(active);
CREATE INDEX IF NOT EXISTS idx_featured_games_position ON featured_games(position);

-- Quick Play Sessions
CREATE TABLE IF NOT EXISTS quick_play_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  score INTEGER,
  completed BOOLEAN DEFAULT false,
  play_duration INTEGER, -- seconds
  device_type VARCHAR(50), -- mobile, tablet, desktop
  browser VARCHAR(50)
);

-- Create indexes for quick play sessions
CREATE INDEX IF NOT EXISTS idx_quick_play_sessions_game_id ON quick_play_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_quick_play_sessions_user_id ON quick_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_play_sessions_started_at ON quick_play_sessions(started_at DESC);

-- Rating Review Votes (for helpful/unhelpful)
CREATE TABLE IF NOT EXISTS rating_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID REFERENCES game_ratings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rating_id, user_id)
);

-- Create index for rating votes
CREATE INDEX IF NOT EXISTS idx_rating_votes_rating_id ON rating_votes(rating_id);

-- RLS Policies

-- Category Views
ALTER TABLE category_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category views are viewable by everyone" ON category_views
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own category views" ON category_views
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Game Ratings
ALTER TABLE game_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game ratings are viewable by everyone" ON game_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own ratings" ON game_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON game_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON game_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Featured Games
ALTER TABLE featured_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured games are viewable by everyone" ON featured_games
  FOR SELECT USING (true);

-- Only admins can manage featured games (admin check would be implemented via custom claim)
CREATE POLICY "Only admins can manage featured games" ON featured_games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Quick Play Sessions
ALTER TABLE quick_play_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quick play sessions" ON quick_play_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create quick play sessions" ON quick_play_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own quick play sessions" ON quick_play_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Rating Votes
ALTER TABLE rating_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rating votes are viewable by everyone" ON rating_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own votes" ON rating_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON rating_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON rating_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Functions

-- Function to calculate average rating for a game
CREATE OR REPLACE FUNCTION get_game_average_rating(p_game_id VARCHAR)
RETURNS TABLE(
  average_rating DECIMAL(2,1),
  total_ratings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating), 1) as average_rating,
    COUNT(*)::INTEGER as total_ratings
  FROM game_ratings
  WHERE game_id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get top players for a category
CREATE OR REPLACE FUNCTION get_category_top_players(p_category_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  total_score BIGINT,
  games_played INTEGER,
  average_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    u.raw_user_meta_data->>'username' as username,
    SUM(s.score) as total_score,
    COUNT(DISTINCT s.game_id)::INTEGER as games_played,
    AVG(s.score)::BIGINT as average_score
  FROM scores s
  JOIN auth.users u ON s.user_id = u.id
  JOIN categories c ON c.id = p_category_id
  WHERE s.game_id IN (
    SELECT g.id 
    FROM games g
    WHERE g.category_id = p_category_id
  )
  AND s.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY s.user_id, u.raw_user_meta_data->>'username'
  ORDER BY total_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update helpful count on ratings
CREATE OR REPLACE FUNCTION update_rating_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE game_ratings
    SET helpful_count = (
      SELECT COUNT(*) 
      FROM rating_votes 
      WHERE rating_id = NEW.rating_id AND is_helpful = true
    )
    WHERE id = NEW.rating_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_ratings
    SET helpful_count = (
      SELECT COUNT(*) 
      FROM rating_votes 
      WHERE rating_id = OLD.rating_id AND is_helpful = true
    )
    WHERE id = OLD.rating_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating helpful count
CREATE TRIGGER update_helpful_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON rating_votes
FOR EACH ROW
EXECUTE FUNCTION update_rating_helpful_count();

-- Sample Featured Games Data (can be customized)
INSERT INTO featured_games (game_id, category_id, position, featured_until, active)
SELECT 
  'chess',
  (SELECT id FROM categories WHERE slug = 'strategy'),
  1,
  NOW() + INTERVAL '7 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM featured_games WHERE game_id = 'chess'
);

INSERT INTO featured_games (game_id, category_id, position, featured_until, active)
SELECT 
  'tetris',
  (SELECT id FROM categories WHERE slug = 'arcade'),
  1,
  NOW() + INTERVAL '7 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM featured_games WHERE game_id = 'tetris'
);

INSERT INTO featured_games (game_id, category_id, position, featured_until, active)
SELECT 
  'sudoku',
  (SELECT id FROM categories WHERE slug = 'puzzle'),
  1,
  NOW() + INTERVAL '7 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM featured_games WHERE game_id = 'sudoku'
);