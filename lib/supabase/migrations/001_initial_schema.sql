-- Initial database schema for mini-games platform
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL, -- Using game slug as foreign key for simplicity
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_session_id TEXT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards view/table for optimized queries
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('all_time', 'monthly', 'weekly', 'daily')),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_session_id TEXT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    total_games_played INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements junction table
CREATE TABLE user_achievements (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Active games table for real-time multiplayer (future feature)
CREATE TABLE active_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL,
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game events table for real-time features
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES active_games(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_scores_game_id ON scores(game_id);
CREATE INDEX idx_scores_player_id ON scores(player_id);
CREATE INDEX idx_scores_guest_session_id ON scores(guest_session_id);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_score ON scores(score DESC);

CREATE INDEX idx_leaderboards_game_id_period ON leaderboards(game_id, period);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);

CREATE INDEX idx_profiles_username ON profiles(username);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_games_updated_at BEFORE UPDATE ON active_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Scores policies - allow read for everyone, write for authenticated users and guests
CREATE POLICY "Scores are viewable by everyone" ON scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON scores
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND player_id = auth.uid()) OR
        (auth.uid() IS NULL AND guest_session_id IS NOT NULL)
    );

-- Leaderboards policies - read-only for everyone
CREATE POLICY "Leaderboards are viewable by everyone" ON leaderboards
    FOR SELECT USING (true);

-- Profiles policies - users can manage their own profile
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- User achievements policies
CREATE POLICY "Users can view all achievements" ON user_achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some initial games data
INSERT INTO games (slug, name, description, category) VALUES
    ('snake', 'Snake', 'Classic Snake game - eat food and grow longer!', 'Arcade'),
    ('tetris', 'Tetris', 'Stack falling blocks to clear lines', 'Puzzle'),
    ('breakout', 'Breakout', 'Break bricks with a bouncing ball', 'Arcade'),
    ('pong', 'Pong', 'Classic two-player paddle game', 'Sports'),
    ('connect-four', 'Connect Four', 'Connect four pieces in a row to win', 'Strategy'),
    ('tic-tac-toe', 'Tic Tac Toe', 'Classic X and O game', 'Strategy'),
    ('memory-game', 'Memory Game', 'Match pairs of cards', 'Memory'),
    ('simon-says', 'Simon Says', 'Repeat the pattern of colors and sounds', 'Memory'),
    ('word-search', 'Word Search', 'Find hidden words in a grid of letters', 'Puzzle'),
    ('sudoku', 'Sudoku', 'Fill the grid with numbers 1-9', 'Puzzle'),
    ('crossword', 'Crossword', 'Fill in the crossword puzzle', 'Word'),
    ('hangman', 'Hangman', 'Guess the word before running out of guesses', 'Word'),
    ('rock-paper-scissors', 'Rock Paper Scissors', 'Classic hand game', 'Strategy'),
    ('maze', 'Maze', 'Navigate through the maze to reach the exit', 'Puzzle'),
    ('trivia', 'Trivia', 'Answer trivia questions correctly', 'Knowledge');

-- Create a function to update leaderboards automatically
CREATE OR REPLACE FUNCTION update_leaderboards()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all-time leaderboard
    INSERT INTO leaderboards (game_id, period, player_id, guest_session_id, player_name, score, rank)
    SELECT 
        NEW.game_id,
        'all_time',
        NEW.player_id,
        NEW.guest_session_id,
        NEW.player_name,
        NEW.score,
        1
    ON CONFLICT DO NOTHING;

    -- Recalculate ranks for all-time leaderboard
    WITH ranked_scores AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY game_id, period ORDER BY score DESC) as new_rank
        FROM leaderboards 
        WHERE game_id = NEW.game_id AND period = 'all_time'
    )
    UPDATE leaderboards 
    SET rank = ranked_scores.new_rank
    FROM ranked_scores 
    WHERE leaderboards.id = ranked_scores.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic leaderboard updates
CREATE TRIGGER update_leaderboards_trigger
    AFTER INSERT ON scores
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboards();