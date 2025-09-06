-- Tournament history and spectator mode tables
-- This migration adds tables for tournament tracking, spectator sessions, and spectator chat

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  game_slug TEXT NOT NULL,
  game_title TEXT NOT NULL,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'registration', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_pool TEXT,
  rules TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Indexes
  INDEX idx_tournaments_status (status),
  INDEX idx_tournaments_game_slug (game_slug),
  INDEX idx_tournaments_organizer (organizer_id),
  INDEX idx_tournaments_start_date (start_date DESC)
);

-- Create tournament participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  seed INTEGER,
  status TEXT NOT NULL CHECK (status IN ('registered', 'checked_in', 'eliminated', 'winner')),
  current_round INTEGER,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  score INTEGER,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(tournament_id, user_id),
  INDEX idx_participants_tournament (tournament_id),
  INDEX idx_participants_user (user_id),
  INDEX idx_participants_status (status)
);

-- Create tournament matches table
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player1_name TEXT,
  player1_score INTEGER,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player2_name TEXT,
  player2_score INTEGER,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'in_progress', 'completed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_matches_tournament (tournament_id),
  INDEX idx_matches_round (round),
  INDEX idx_matches_status (status),
  UNIQUE(tournament_id, round, match_number)
);

-- Create tournament history table (for user statistics)
CREATE TABLE IF NOT EXISTS public.tournament_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  placement INTEGER,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_score INTEGER,
  prize_won TEXT,
  participation_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id, tournament_id),
  INDEX idx_history_user (user_id),
  INDEX idx_history_tournament (tournament_id),
  INDEX idx_history_date (participation_date DESC)
);

-- Create spectator sessions table
CREATE TABLE IF NOT EXISTS public.spectator_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_type TEXT NOT NULL CHECK (session_type IN ('game', 'tournament')),
  target_id UUID NOT NULL, -- game_session_id or tournament_match_id
  host_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_username TEXT NOT NULL,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_spectator_type (session_type),
  INDEX idx_spectator_target (target_id),
  INDEX idx_spectator_host (host_user_id),
  INDEX idx_spectator_active (is_active)
);

-- Create spectator viewers table (who's watching)
CREATE TABLE IF NOT EXISTS public.spectator_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.spectator_sessions(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_name TEXT NOT NULL,
  viewer_type TEXT CHECK (viewer_type IN ('registered', 'guest')) DEFAULT 'guest',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  left_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_viewers_session (session_id),
  INDEX idx_viewers_user (viewer_id),
  UNIQUE(session_id, viewer_id)
);

-- Create spectator chat table
CREATE TABLE IF NOT EXISTS public.spectator_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.spectator_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('chat', 'system', 'reaction')) DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  INDEX idx_chat_session (session_id),
  INDEX idx_chat_user (user_id),
  INDEX idx_chat_created (created_at DESC)
);

-- Create tournament announcements table
CREATE TABLE IF NOT EXISTS public.tournament_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  INDEX idx_announcements_tournament (tournament_id),
  INDEX idx_announcements_priority (priority),
  INDEX idx_announcements_created (created_at DESC)
);

-- Enable RLS on new tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectator_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectator_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "Users can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own tournaments" ON public.tournaments
  FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS Policies for tournament participants
CREATE POLICY "Participants are viewable by everyone" ON public.tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can register for tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.tournament_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for tournament matches
CREATE POLICY "Matches are viewable by everyone" ON public.tournament_matches
  FOR SELECT USING (true);

CREATE POLICY "Organizers can manage matches" ON public.tournament_matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t 
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- RLS Policies for tournament history
CREATE POLICY "History is viewable by everyone" ON public.tournament_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert history" ON public.tournament_history
  FOR INSERT WITH CHECK (true);

-- RLS Policies for spectator sessions
CREATE POLICY "Spectator sessions are viewable by everyone" ON public.spectator_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can create spectator sessions" ON public.spectator_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_user_id OR host_user_id IS NULL);

CREATE POLICY "Hosts can update own sessions" ON public.spectator_sessions
  FOR UPDATE USING (auth.uid() = host_user_id OR host_user_id IS NULL);

-- RLS Policies for spectator viewers
CREATE POLICY "Viewers are viewable by everyone" ON public.spectator_viewers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join as viewer" ON public.spectator_viewers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Viewers can update own record" ON public.spectator_viewers
  FOR UPDATE USING (auth.uid() = viewer_id OR viewer_id IS NULL);

-- RLS Policies for spectator chat
CREATE POLICY "Chat is viewable by everyone" ON public.spectator_chat
  FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON public.spectator_chat
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for tournament announcements
CREATE POLICY "Announcements are viewable by everyone" ON public.tournament_announcements
  FOR SELECT USING (true);

CREATE POLICY "Organizers can create announcements" ON public.tournament_announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t 
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Functions for tournament statistics
CREATE OR REPLACE FUNCTION get_tournament_stats(user_id_param UUID)
RETURNS TABLE(
  total_tournaments INTEGER,
  tournaments_won INTEGER,
  tournaments_participated INTEGER,
  win_rate NUMERIC,
  average_placement NUMERIC,
  best_placement INTEGER,
  total_prize_won TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT th.tournament_id)::INTEGER as total_tournaments,
    COUNT(DISTINCT CASE WHEN th.placement = 1 THEN th.tournament_id END)::INTEGER as tournaments_won,
    COUNT(DISTINCT th.tournament_id)::INTEGER as tournaments_participated,
    ROUND(
      CASE 
        WHEN COUNT(DISTINCT th.tournament_id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN th.placement = 1 THEN th.tournament_id END)::NUMERIC / COUNT(DISTINCT th.tournament_id)::NUMERIC) * 100
        ELSE 0
      END, 2
    ) as win_rate,
    ROUND(AVG(th.placement), 2) as average_placement,
    MIN(th.placement)::INTEGER as best_placement,
    STRING_AGG(DISTINCT th.prize_won, ', ') as total_prize_won
  FROM public.tournament_history th
  WHERE th.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get active spectator sessions
CREATE OR REPLACE FUNCTION get_active_spectator_sessions(
  session_type_param TEXT DEFAULT NULL,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE(
  session_id UUID,
  session_type TEXT,
  target_id UUID,
  host_username TEXT,
  viewer_count INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  game_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.id as session_id,
    ss.session_type,
    ss.target_id,
    ss.host_username,
    ss.viewer_count,
    ss.started_at,
    CASE 
      WHEN ss.session_type = 'game' THEN (
        SELECT jsonb_build_object(
          'game_name', g.name,
          'game_slug', g.slug
        )
        FROM public.game_sessions gs
        JOIN public.games g ON gs.game_id = g.id
        WHERE gs.id = ss.target_id
      )
      WHEN ss.session_type = 'tournament' THEN (
        SELECT jsonb_build_object(
          'tournament_name', t.name,
          'game_title', t.game_title,
          'round', tm.round,
          'match_number', tm.match_number
        )
        FROM public.tournament_matches tm
        JOIN public.tournaments t ON tm.tournament_id = t.id
        WHERE tm.id = ss.target_id
      )
    END as game_info
  FROM public.spectator_sessions ss
  WHERE ss.is_active = true
    AND (session_type_param IS NULL OR ss.session_type = session_type_param)
  ORDER BY ss.viewer_count DESC, ss.started_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tournament participant count
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_participants_count
AFTER INSERT OR DELETE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION update_tournament_participant_count();

-- Trigger to update spectator viewer count
CREATE OR REPLACE FUNCTION update_spectator_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.spectator_sessions
    SET viewer_count = viewer_count + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
      UPDATE public.spectator_sessions
      SET viewer_count = GREATEST(0, viewer_count - 1)
      WHERE id = NEW.session_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.spectator_sessions
    SET viewer_count = GREATEST(0, viewer_count - 1)
    WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spectator_viewers_count
AFTER INSERT OR UPDATE OR DELETE ON public.spectator_viewers
FOR EACH ROW EXECUTE FUNCTION update_spectator_viewer_count();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();