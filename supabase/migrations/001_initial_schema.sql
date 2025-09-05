-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create scores table
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_id TEXT, -- For anonymous users
  score INTEGER NOT NULL,
  game_data JSONB, -- Store game-specific data (e.g., WPM for typing test, moves for memory match)
  duration INTEGER, -- Game duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Indexes for performance
  INDEX idx_scores_game_id (game_id),
  INDEX idx_scores_user_id (user_id),
  INDEX idx_scores_created_at (created_at DESC),
  INDEX idx_scores_score (score DESC)
);

-- Create leaderboards view for easier querying
CREATE OR REPLACE VIEW public.leaderboards AS
SELECT 
  s.id,
  s.game_id,
  g.name as game_name,
  g.slug as game_slug,
  s.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  s.guest_id,
  s.score,
  s.game_data,
  s.duration,
  s.created_at,
  ROW_NUMBER() OVER (PARTITION BY s.game_id ORDER BY s.score DESC, s.created_at ASC) as rank
FROM public.scores s
JOIN public.games g ON s.game_id = g.id
LEFT JOIN public.profiles p ON s.user_id = p.id
WHERE g.is_active = true;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  criteria JSONB, -- Store achievement criteria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id, achievement_id)
);

-- Create game_sessions table for tracking play sessions
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  session_data JSONB, -- Store session-specific data
  
  INDEX idx_sessions_game_id (game_id),
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_started_at (started_at DESC)
);

-- Insert initial games
INSERT INTO public.games (slug, name, description, category) VALUES
  ('cps-test', 'CPS Test', 'Test your clicking speed', 'speed'),
  ('memory-match', 'Memory Match', 'Match the cards', 'memory'),
  ('typing-test', 'Typing Test', 'Test your typing speed', 'speed'),
  ('snake', 'Snake', 'Classic snake game', 'arcade'),
  ('2048', '2048', 'Slide tiles to reach 2048', 'puzzle'),
  ('sudoku', 'Sudoku', 'Number puzzle game', 'puzzle')
ON CONFLICT (slug) DO NOTHING;

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Scores policies
CREATE POLICY "Scores are viewable by everyone" ON public.scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON public.scores
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Achievements policies
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "User achievements are viewable by everyone" ON public.user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Game sessions policies
CREATE POLICY "Sessions are viewable by everyone" ON public.game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create functions for leaderboard queries
CREATE OR REPLACE FUNCTION get_game_leaderboard(
  game_slug_param TEXT,
  limit_param INTEGER DEFAULT 100,
  time_range TEXT DEFAULT 'all'
)
RETURNS TABLE(
  rank BIGINT,
  username TEXT,
  display_name TEXT,
  score INTEGER,
  game_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY s.score DESC, s.created_at ASC) as rank,
    COALESCE(p.username, 'Guest-' || LEFT(s.guest_id, 8)) as username,
    p.display_name,
    s.score,
    s.game_data,
    s.created_at
  FROM public.scores s
  JOIN public.games g ON s.game_id = g.id
  LEFT JOIN public.profiles p ON s.user_id = p.id
  WHERE g.slug = game_slug_param
    AND (
      time_range = 'all' OR
      (time_range = 'today' AND s.created_at >= CURRENT_DATE) OR
      (time_range = 'week' AND s.created_at >= CURRENT_DATE - INTERVAL '7 days') OR
      (time_range = 'month' AND s.created_at >= CURRENT_DATE - INTERVAL '30 days')
    )
  ORDER BY s.score DESC, s.created_at ASC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's best scores
CREATE OR REPLACE FUNCTION get_user_best_scores(
  user_id_param UUID
)
RETURNS TABLE(
  game_name TEXT,
  game_slug TEXT,
  best_score INTEGER,
  rank BIGINT,
  total_plays BIGINT,
  last_played TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.name as game_name,
    g.slug as game_slug,
    MAX(s.score) as best_score,
    MIN(lb.rank) as rank,
    COUNT(s.id) as total_plays,
    MAX(s.created_at) as last_played
  FROM public.scores s
  JOIN public.games g ON s.game_id = g.id
  LEFT JOIN public.leaderboards lb ON lb.id = s.id
  WHERE s.user_id = user_id_param
  GROUP BY g.id, g.name, g.slug;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();