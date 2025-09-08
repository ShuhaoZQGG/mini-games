-- Combined Migration Script for Production
-- Run this in Supabase SQL Editor to set up all tables

-- ============================================
-- PART 1: INITIAL SCHEMA (001_initial_schema.sql)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stats JSONB DEFAULT '{"games_played": 0, "total_score": 0, "achievements": []}'::jsonb,
  preferences JSONB DEFAULT '{"theme": "light", "sound": true, "notifications": true}'::jsonb
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  min_players INTEGER DEFAULT 1,
  max_players INTEGER DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  tags TEXT[],
  rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  play_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  game_mode TEXT,
  game_data JSONB,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT true
);

-- Create leaderboards view
CREATE OR REPLACE VIEW leaderboards AS
SELECT 
  s.game_id,
  g.name as game_name,
  g.slug as game_slug,
  s.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  s.score,
  s.game_mode,
  s.created_at,
  ROW_NUMBER() OVER (PARTITION BY s.game_id, s.game_mode ORDER BY s.score DESC) as rank
FROM scores s
JOIN games g ON s.game_id = g.id
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.is_verified = true;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT,
  points INTEGER DEFAULT 10,
  requirements JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  game_id UUID REFERENCES games(id),
  UNIQUE(user_id, achievement_id)
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'expired')) DEFAULT 'pending',
  challenger_score INTEGER,
  challenged_score INTEGER,
  winner_id UUID REFERENCES auth.users(id),
  challenge_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES auth.users(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  prize_pool JSONB,
  rules JSONB,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_private BOOLEAN DEFAULT false,
  access_code TEXT
);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: TOURNAMENT HISTORY SCHEMA (002_tournament_history.sql)
-- ============================================

-- Tournament matches table for tracking individual games
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  player1_score INTEGER,
  player2_score INTEGER,
  match_data JSONB,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'forfeit')) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament history for tracking past tournaments
CREATE TABLE IF NOT EXISTS tournament_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  final_rank INTEGER,
  total_score INTEGER,
  matches_played INTEGER,
  matches_won INTEGER,
  matches_lost INTEGER,
  prize_won DECIMAL(10, 2),
  statistics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Spectator sessions for live viewing
CREATE TABLE IF NOT EXISTS spectator_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id TEXT NOT NULL,
  tournament_id UUID REFERENCES tournaments(id),
  match_id UUID REFERENCES tournament_matches(id),
  host_user_id UUID REFERENCES auth.users(id),
  game_id UUID REFERENCES games(id),
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  game_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spectator chat messages
CREATE TABLE IF NOT EXISTS spectator_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES spectator_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend leaderboards
CREATE TABLE IF NOT EXISTS friend_leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')) DEFAULT 'all_time',
  friend_scores JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, period)
);

-- ============================================
-- INDEXES
-- ============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_scores_game_user ON scores(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_history_user ON tournament_history(user_id);
CREATE INDEX IF NOT EXISTS idx_spectator_sessions_live ON spectator_sessions(is_live);
CREATE INDEX IF NOT EXISTS idx_spectator_messages_session ON spectator_messages(session_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE spectator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spectator_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_leaderboards ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scores policies
CREATE POLICY "Scores are viewable by everyone" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON scores
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Achievements policies
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friends policies
CREATE POLICY "Users can view own friends" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend requests" ON friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Challenges policies
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Tournament policies
CREATE POLICY "Tournament participants can view tournament" ON tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join tournaments" ON tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Tournament history policies
CREATE POLICY "Tournament history is public" ON tournament_history
  FOR SELECT USING (true);

-- Spectator policies
CREATE POLICY "Spectator sessions are public" ON spectator_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can create spectator sessions" ON spectator_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Spectator messages are public" ON spectator_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can send spectator messages" ON spectator_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friend leaderboards policies
CREATE POLICY "Users can view friend leaderboards" ON friend_leaderboards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update friend leaderboards" ON friend_leaderboards
  FOR ALL USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert game records
INSERT INTO games (slug, name, description, category, difficulty, tags) VALUES
  ('cps-test', 'CPS Test', 'Test your clicks per second', 'speed', 'easy', ARRAY['speed', 'clicking']),
  ('memory-match', 'Memory Match', 'Match pairs of cards', 'puzzle', 'easy', ARRAY['memory', 'puzzle']),
  ('typing-test', 'Typing Test', 'Test your typing speed', 'speed', 'medium', ARRAY['typing', 'speed']),
  ('snake', 'Snake', 'Classic snake game', 'arcade', 'easy', ARRAY['arcade', 'classic']),
  ('2048', '2048', 'Combine tiles to reach 2048', 'puzzle', 'medium', ARRAY['puzzle', 'numbers']),
  ('sudoku', 'Sudoku', 'Fill in the numbers', 'puzzle', 'hard', ARRAY['puzzle', 'logic']),
  ('reaction-time', 'Reaction Time', 'Test your reflexes', 'speed', 'easy', ARRAY['speed', 'reflexes']),
  ('tic-tac-toe', 'Tic-Tac-Toe', 'Classic strategy game', 'strategy', 'easy', ARRAY['strategy', 'classic']),
  ('minesweeper', 'Minesweeper', 'Find all the mines', 'puzzle', 'medium', ARRAY['puzzle', 'logic']),
  ('connect-four', 'Connect Four', 'Connect four in a row', 'strategy', 'medium', ARRAY['strategy', 'classic']),
  ('word-search', 'Word Search', 'Find hidden words', 'puzzle', 'medium', ARRAY['puzzle', 'words']),
  ('tetris', 'Tetris', 'Stack the blocks', 'arcade', 'medium', ARRAY['arcade', 'classic']),
  ('aim-trainer', 'Aim Trainer', 'Improve your aim', 'speed', 'medium', ARRAY['speed', 'accuracy']),
  ('breakout', 'Breakout', 'Break all the bricks', 'arcade', 'easy', ARRAY['arcade', 'classic']),
  ('mental-math', 'Mental Math', 'Quick math challenges', 'educational', 'medium', ARRAY['math', 'educational']),
  ('solitaire', 'Solitaire', 'Classic card game', 'card', 'medium', ARRAY['card', 'classic']),
  ('simon-says', 'Simon Says', 'Memory pattern game', 'memory', 'medium', ARRAY['memory', 'pattern']),
  ('whack-a-mole', 'Whack-a-Mole', 'Hit the moles quickly', 'arcade', 'easy', ARRAY['arcade', 'speed'])
ON CONFLICT (slug) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: profiles, games, scores, achievements, friends, challenges, tournaments, etc.';
  RAISE NOTICE 'RLS policies applied for security';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE 'Initial game data seeded';
END $$;