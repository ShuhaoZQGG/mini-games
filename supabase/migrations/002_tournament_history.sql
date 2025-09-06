-- Tournament History Tables
-- Tracks tournament participation and results for statistics

-- Create tournament_history table
CREATE TABLE IF NOT EXISTS public.tournament_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  placement INTEGER NOT NULL CHECK (placement > 0),
  matches_played INTEGER DEFAULT 0 CHECK (matches_played >= 0),
  matches_won INTEGER DEFAULT 0 CHECK (matches_won >= 0),
  total_score INTEGER DEFAULT 0,
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  prize_won DECIMAL(10, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN matches_played > 0 THEN (matches_won::DECIMAL / matches_played * 100)
      ELSE 0
    END
  ) STORED,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Prevent duplicate entries for same tournament and user
  UNIQUE(tournament_id, user_id),
  
  -- Ensure matches_won doesn't exceed matches_played
  CHECK (matches_won <= matches_played)
);

-- Create indexes for performance
CREATE INDEX idx_tournament_history_user_id ON public.tournament_history(user_id);
CREATE INDEX idx_tournament_history_tournament_id ON public.tournament_history(tournament_id);
CREATE INDEX idx_tournament_history_game_slug ON public.tournament_history(game_slug);
CREATE INDEX idx_tournament_history_completed_at ON public.tournament_history(completed_at DESC);
CREATE INDEX idx_tournament_history_placement ON public.tournament_history(placement);

-- Create private_tournaments table for friends-only and invite-only tournaments
CREATE TABLE IF NOT EXISTS public.private_tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL,
  name TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_participants INTEGER NOT NULL CHECK (max_participants > 1),
  is_private BOOLEAN DEFAULT false,
  friends_only BOOLEAN DEFAULT false,
  access_code TEXT UNIQUE,
  password_hash TEXT,
  allowed_users UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for private tournaments
CREATE INDEX idx_private_tournaments_organizer ON public.private_tournaments(organizer_id);
CREATE INDEX idx_private_tournaments_access_code ON public.private_tournaments(access_code);
CREATE INDEX idx_private_tournaments_game_slug ON public.private_tournaments(game_slug);

-- Create spectators table for tracking viewers
CREATE TABLE IF NOT EXISTS public.spectators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id UUID NOT NULL,
  tournament_match_id UUID,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_guest_id TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  left_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN left_at IS NOT NULL THEN EXTRACT(EPOCH FROM (left_at - joined_at))::INTEGER
      ELSE NULL
    END
  ) STORED,
  
  -- Ensure either viewer_id or viewer_guest_id is provided
  CHECK (viewer_id IS NOT NULL OR viewer_guest_id IS NOT NULL)
);

-- Create indexes for spectators
CREATE INDEX idx_spectators_game_session ON public.spectators(game_session_id);
CREATE INDEX idx_spectators_tournament_match ON public.spectators(tournament_match_id);
CREATE INDEX idx_spectators_viewer_id ON public.spectators(viewer_id);
CREATE INDEX idx_spectators_joined_at ON public.spectators(joined_at DESC);

-- Create spectator_chat table for live chat during spectating
CREATE TABLE IF NOT EXISTS public.spectator_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id UUID NOT NULL,
  tournament_match_id UUID,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(message) <= 500),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for spectator chat
CREATE INDEX idx_spectator_chat_game_session ON public.spectator_chat(game_session_id);
CREATE INDEX idx_spectator_chat_tournament_match ON public.spectator_chat(tournament_match_id);
CREATE INDEX idx_spectator_chat_sent_at ON public.spectator_chat(sent_at DESC);

-- Create tournament_statistics view for aggregated stats
CREATE OR REPLACE VIEW public.tournament_statistics AS
SELECT 
  user_id,
  COUNT(DISTINCT tournament_id) as total_tournaments,
  COUNT(DISTINCT CASE WHEN placement = 1 THEN tournament_id END) as tournaments_won,
  AVG(placement)::DECIMAL(5,2) as average_placement,
  MIN(placement) as best_placement,
  SUM(matches_played) as total_matches_played,
  SUM(matches_won) as total_matches_won,
  CASE 
    WHEN SUM(matches_played) > 0 
    THEN (SUM(matches_won)::DECIMAL / SUM(matches_played) * 100)::DECIMAL(5,2)
    ELSE 0
  END as overall_match_win_rate,
  SUM(prize_won) as total_prize_won,
  ARRAY_AGG(DISTINCT game_slug) as games_played,
  MODE() WITHIN GROUP (ORDER BY game_slug) as favorite_game,
  MAX(completed_at) as last_tournament_date
FROM public.tournament_history
GROUP BY user_id;

-- Create friend_tournament_leaderboard view
CREATE OR REPLACE VIEW public.friend_tournament_leaderboard AS
WITH user_stats AS (
  SELECT 
    th.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COUNT(DISTINCT th.tournament_id) as tournaments_played,
    COUNT(DISTINCT CASE WHEN th.placement = 1 THEN th.tournament_id END) as tournaments_won,
    AVG(th.placement)::DECIMAL(5,2) as avg_placement,
    SUM(th.prize_won) as total_winnings,
    ARRAY_AGG(DISTINCT th.game_slug) as games
  FROM public.tournament_history th
  JOIN public.profiles p ON th.user_id = p.id
  GROUP BY th.user_id, p.username, p.display_name, p.avatar_url
)
SELECT 
  us.*,
  RANK() OVER (ORDER BY tournaments_won DESC, avg_placement ASC) as rank
FROM user_stats us;

-- Create function to generate access code for private tournaments
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate tournament access
CREATE OR REPLACE FUNCTION validate_tournament_access(
  p_tournament_id UUID,
  p_user_id UUID,
  p_access_code TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tournament RECORD;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.private_tournaments
  WHERE tournament_id = p_tournament_id;
  
  -- If tournament doesn't exist or is not private, allow access
  IF NOT FOUND OR NOT v_tournament.is_private THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is the organizer
  IF v_tournament.organizer_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check access code
  IF v_tournament.access_code IS NOT NULL AND p_access_code = v_tournament.access_code THEN
    -- If friends only, check if user is in allowed list
    IF v_tournament.friends_only THEN
      RETURN p_user_id = ANY(v_tournament.allowed_users);
    END IF;
    RETURN TRUE;
  END IF;
  
  -- Check password (would need proper hashing in production)
  IF v_tournament.password_hash IS NOT NULL AND p_password IS NOT NULL THEN
    -- In production, use proper password verification
    -- For now, just check if password matches (simplified)
    IF v_tournament.password_hash = p_password THEN
      IF v_tournament.friends_only THEN
        RETURN p_user_id = ANY(v_tournament.allowed_users);
      END IF;
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for tournament_history
ALTER TABLE public.tournament_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own tournament history
CREATE POLICY tournament_history_select_own ON public.tournament_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view tournament history of their friends (requires friends table)
CREATE POLICY tournament_history_select_friends ON public.tournament_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE (user_id = auth.uid() AND friend_id = tournament_history.user_id)
        OR (friend_id = auth.uid() AND user_id = tournament_history.user_id)
    )
  );

-- System can insert tournament history
CREATE POLICY tournament_history_insert ON public.tournament_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for private_tournaments
ALTER TABLE public.private_tournaments ENABLE ROW LEVEL SECURITY;

-- Anyone can view public tournament info
CREATE POLICY private_tournaments_select ON public.private_tournaments
  FOR SELECT
  USING (
    NOT is_private 
    OR organizer_id = auth.uid()
    OR auth.uid() = ANY(allowed_users)
  );

-- Organizers can create private tournaments
CREATE POLICY private_tournaments_insert ON public.private_tournaments
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

-- Organizers can update their tournaments
CREATE POLICY private_tournaments_update ON public.private_tournaments
  FOR UPDATE
  USING (auth.uid() = organizer_id);

-- Create RLS policies for spectators
ALTER TABLE public.spectators ENABLE ROW LEVEL SECURITY;

-- Anyone can view spectator counts
CREATE POLICY spectators_select ON public.spectators
  FOR SELECT
  USING (true);

-- Users can add themselves as spectators
CREATE POLICY spectators_insert ON public.spectators
  FOR INSERT
  WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);

-- Users can update their own spectator records
CREATE POLICY spectators_update ON public.spectators
  FOR UPDATE
  USING (auth.uid() = viewer_id);

-- Create RLS policies for spectator_chat
ALTER TABLE public.spectator_chat ENABLE ROW LEVEL SECURITY;

-- Anyone can view chat messages
CREATE POLICY spectator_chat_select ON public.spectator_chat
  FOR SELECT
  USING (NOT is_deleted);

-- Authenticated users can send messages
CREATE POLICY spectator_chat_insert ON public.spectator_chat
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can soft delete their own messages
CREATE POLICY spectator_chat_update ON public.spectator_chat
  FOR UPDATE
  USING (auth.uid() = sender_id);