-- Migration: 004_global_features
-- Description: Add tables for global leaderboards, tournaments, and achievements
-- Created: 2025-01-11

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEADERBOARDS SYSTEM
-- ============================================

-- Global leaderboards table
CREATE TABLE IF NOT EXISTS global_leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    score BIGINT NOT NULL DEFAULT 0,
    rank INTEGER,
    time_played INTEGER DEFAULT 0, -- in seconds
    games_played INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    period_type VARCHAR(20) NOT NULL DEFAULT 'all_time', -- daily, weekly, monthly, all_time
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id, period_type, period_start)
);

-- Create indexes for performance
CREATE INDEX idx_leaderboards_game_score ON global_leaderboards(game_id, score DESC);
CREATE INDEX idx_leaderboards_user ON global_leaderboards(user_id);
CREATE INDEX idx_leaderboards_period ON global_leaderboards(period_type, period_start, period_end);
CREATE INDEX idx_leaderboards_rank ON global_leaderboards(game_id, period_type, rank);

-- ============================================
-- TOURNAMENTS SYSTEM
-- ============================================

-- Tournament definitions
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    game_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, registration, active, completed, cancelled
    type VARCHAR(50) NOT NULL DEFAULT 'single_elimination', -- single_elimination, double_elimination, round_robin, swiss
    entry_fee DECIMAL(10,2) DEFAULT 0,
    prize_pool DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER NOT NULL DEFAULT 32,
    min_participants INTEGER NOT NULL DEFAULT 2,
    current_participants INTEGER DEFAULT 0,
    registration_starts TIMESTAMP WITH TIME ZONE,
    registration_ends TIMESTAMP WITH TIME ZONE,
    tournament_starts TIMESTAMP WITH TIME ZONE,
    tournament_ends TIMESTAMP WITH TIME ZONE,
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'registered', -- registered, checked_in, playing, eliminated, winner, disqualified
    seed INTEGER,
    final_rank INTEGER,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    prize_amount DECIMAL(10,2) DEFAULT 0,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    eliminated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(tournament_id, user_id)
);

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    bracket_position VARCHAR(50), -- for bracket tournaments
    player1_id UUID REFERENCES auth.users(id),
    player2_id UUID REFERENCES auth.users(id),
    player1_score BIGINT,
    player2_score BIGINT,
    winner_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, ready, in_progress, completed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    next_match_id UUID REFERENCES tournament_matches(id),
    game_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    UNIQUE(tournament_id, round, match_number)
);

-- Create indexes for tournaments
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_game ON tournaments(game_id);
CREATE INDEX idx_tournaments_dates ON tournaments(registration_starts, tournament_starts);
CREATE INDEX idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(tournament_id, status);
CREATE INDEX idx_tournament_matches_round ON tournament_matches(tournament_id, round);
CREATE INDEX idx_tournament_matches_players ON tournament_matches(player1_id, player2_id);

-- ============================================
-- ACHIEVEMENTS SYSTEM
-- ============================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- gameplay, social, collection, special, seasonal
    game_id VARCHAR(100), -- NULL for platform-wide achievements
    icon_url TEXT,
    rarity VARCHAR(50) NOT NULL DEFAULT 'common', -- common, uncommon, rare, epic, legendary
    points INTEGER NOT NULL DEFAULT 10,
    requirements JSONB NOT NULL, -- JSON structure defining achievement criteria
    is_secret BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- Progress towards achievement (0-100)
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    notified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Achievement progress tracking
CREATE TABLE IF NOT EXISTS achievement_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value BIGINT NOT NULL DEFAULT 0,
    max_value BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id, metric_name)
);

-- Create indexes for achievements
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_game ON achievements(game_id);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, unlocked);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_achievement_progress_user ON achievement_progress(user_id, achievement_id);

-- ============================================
-- PLAYER STATISTICS
-- ============================================

-- Comprehensive player statistics
CREATE TABLE IF NOT EXISTS player_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id VARCHAR(100),
    total_score BIGINT DEFAULT 0,
    high_score BIGINT DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    average_score BIGINT DEFAULT 0,
    total_playtime INTEGER DEFAULT 0, -- in seconds
    last_played_at TIMESTAMP WITH TIME ZONE,
    favorite_game_mode VARCHAR(100),
    achievements_unlocked INTEGER DEFAULT 0,
    tournaments_entered INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points BIGINT DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

-- Create indexes for statistics
CREATE INDEX idx_player_statistics_user ON player_statistics(user_id);
CREATE INDEX idx_player_statistics_game ON player_statistics(game_id);
CREATE INDEX idx_player_statistics_score ON player_statistics(total_score DESC);
CREATE INDEX idx_player_statistics_level ON player_statistics(level DESC, experience_points DESC);

-- ============================================
-- REAL-TIME EVENTS & NOTIFICATIONS
-- ============================================

-- Game events for real-time updates
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- score_update, achievement_unlocked, tournament_update, etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id VARCHAR(100),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for events
CREATE INDEX idx_game_events_type ON game_events(event_type, processed);
CREATE INDEX idx_game_events_user ON game_events(user_id, created_at DESC);
CREATE INDEX idx_game_events_created ON game_events(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update player rank in leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update ranks for the affected game and period
    WITH ranked_scores AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY game_id, period_type 
                ORDER BY score DESC, updated_at ASC
            ) AS new_rank
        FROM global_leaderboards
        WHERE game_id = NEW.game_id 
        AND period_type = NEW.period_type
    )
    UPDATE global_leaderboards
    SET rank = ranked_scores.new_rank
    FROM ranked_scores
    WHERE global_leaderboards.id = ranked_scores.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ranks when scores change
CREATE TRIGGER trigger_update_leaderboard_ranks
AFTER INSERT OR UPDATE OF score ON global_leaderboards
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_ranks();

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievement_unlock(
    p_user_id UUID,
    p_achievement_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_requirements JSONB;
    v_unlocked BOOLEAN;
BEGIN
    -- Get achievement requirements
    SELECT requirements INTO v_requirements
    FROM achievements
    WHERE id = p_achievement_id;
    
    -- Check if requirements are met (simplified logic)
    -- In production, this would check against actual game data
    SELECT progress >= 100 INTO v_unlocked
    FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
    
    IF v_unlocked THEN
        UPDATE user_achievements
        SET unlocked = TRUE,
            unlocked_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id 
        AND achievement_id = p_achievement_id
        AND NOT unlocked;
        
        -- Create event for notification
        INSERT INTO game_events (event_type, user_id, achievement_id, data)
        VALUES ('achievement_unlocked', p_user_id, p_achievement_id, 
                jsonb_build_object('timestamp', CURRENT_TIMESTAMP));
    END IF;
    
    RETURN v_unlocked;
END;
$$ LANGUAGE plpgsql;

-- Function to update player statistics
CREATE OR REPLACE FUNCTION update_player_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert player statistics
    INSERT INTO player_statistics (
        user_id, game_id, total_score, high_score, games_played, last_played_at
    )
    VALUES (
        NEW.user_id, NEW.game_id, NEW.score, NEW.score, 1, CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, game_id) DO UPDATE
    SET total_score = player_statistics.total_score + NEW.score,
        high_score = GREATEST(player_statistics.high_score, NEW.score),
        games_played = player_statistics.games_played + 1,
        last_played_at = CURRENT_TIMESTAMP,
        average_score = (player_statistics.total_score + NEW.score) / (player_statistics.games_played + 1),
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics when new scores are added
CREATE TRIGGER trigger_update_player_statistics
AFTER INSERT ON global_leaderboards
FOR EACH ROW
EXECUTE FUNCTION update_player_statistics();

-- Function to clean up old period-based leaderboards
CREATE OR REPLACE FUNCTION cleanup_old_leaderboards()
RETURNS void AS $$
BEGIN
    -- Delete daily leaderboards older than 30 days
    DELETE FROM global_leaderboards
    WHERE period_type = 'daily'
    AND period_end < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Delete weekly leaderboards older than 90 days
    DELETE FROM global_leaderboards
    WHERE period_type = 'weekly'
    AND period_end < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Delete monthly leaderboards older than 1 year
    DELETE FROM global_leaderboards
    WHERE period_type = 'monthly'
    AND period_end < CURRENT_TIMESTAMP - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE global_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Leaderboards policies
CREATE POLICY "Leaderboards are viewable by everyone" ON global_leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own leaderboard entries" ON global_leaderboards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries" ON global_leaderboards
    FOR UPDATE USING (auth.uid() = user_id);

-- Tournaments policies
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments
    FOR SELECT USING (true);

CREATE POLICY "Tournament participants are viewable by everyone" ON tournament_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can register for tournaments" ON tournament_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (NOT is_secret OR EXISTS (
        SELECT 1 FROM user_achievements 
        WHERE achievement_id = achievements.id 
        AND user_id = auth.uid() 
        AND unlocked = true
    ));

CREATE POLICY "Users can view their own achievement progress" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Player statistics policies
CREATE POLICY "Users can view their own statistics" ON player_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public statistics are viewable by everyone" ON player_statistics
    FOR SELECT USING (true);

-- Game events policies
CREATE POLICY "Users can view their own events" ON game_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" ON game_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample achievements
INSERT INTO achievements (code, name, description, category, rarity, points, requirements) VALUES
('first_win', 'First Victory', 'Win your first game', 'gameplay', 'common', 10, '{"wins": 1}'),
('speed_demon', 'Speed Demon', 'Complete a game in under 30 seconds', 'gameplay', 'rare', 50, '{"time_limit": 30}'),
('marathon_player', 'Marathon Player', 'Play for 1 hour straight', 'gameplay', 'uncommon', 25, '{"playtime": 3600}'),
('social_butterfly', 'Social Butterfly', 'Play with 10 different players', 'social', 'uncommon', 20, '{"unique_opponents": 10}'),
('tournament_champion', 'Tournament Champion', 'Win a tournament', 'special', 'epic', 100, '{"tournament_wins": 1}'),
('collector', 'Collector', 'Unlock 50 achievements', 'collection', 'legendary', 200, '{"achievements_unlocked": 50}')
ON CONFLICT (code) DO NOTHING;

-- Create a scheduled job to clean up old leaderboards (runs daily)
-- Note: This would typically be set up as a cron job or scheduled task
-- SELECT cron.schedule('cleanup-leaderboards', '0 2 * * *', 'SELECT cleanup_old_leaderboards();');