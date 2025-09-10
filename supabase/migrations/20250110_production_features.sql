-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- RLS policies for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for analytics (write-only for users, read for admin)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE
  ON user_preferences FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a materialized view for game popularity (for recommendations)
CREATE MATERIALIZED VIEW IF NOT EXISTS game_popularity AS
SELECT 
  properties->>'gameId' as game_id,
  COUNT(*) as play_count,
  COUNT(DISTINCT user_id) as unique_players,
  AVG((properties->>'duration')::int) as avg_duration,
  MAX(created_at) as last_played
FROM analytics_events
WHERE name = 'game_end'
  AND properties->>'gameId' IS NOT NULL
GROUP BY properties->>'gameId';

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_game_popularity_game_id ON game_popularity(game_id);
CREATE INDEX IF NOT EXISTS idx_game_popularity_play_count ON game_popularity(play_count DESC);

-- Function to refresh game popularity (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_game_popularity()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY game_popularity;
END;
$$ language 'plpgsql';