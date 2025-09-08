-- Level System Database Schema
-- Migration: 003_level_system.sql
-- Purpose: Add level system support for all games

-- Game level configurations
CREATE TABLE IF NOT EXISTS game_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR(50) NOT NULL,
  level_number INT NOT NULL,
  name VARCHAR(100),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert', 'master')),
  config JSONB NOT NULL DEFAULT '{}',
  unlock_requirement JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, level_number)
);

-- User progress tracking for levels
CREATE TABLE IF NOT EXISTS user_level_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL,
  current_level INT DEFAULT 1,
  unlocked_levels INT[] DEFAULT ARRAY[1],
  level_scores JSONB DEFAULT '{}',
  stars JSONB DEFAULT '{}',
  completion_times JSONB DEFAULT '{}',
  total_stars INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Add level-specific columns to game_scores table
ALTER TABLE game_scores 
ADD COLUMN IF NOT EXISTS level_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS stars INT CHECK (stars >= 0 AND stars <= 3),
ADD COLUMN IF NOT EXISTS level_config JSONB DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_levels_game_id ON game_levels(game_id);
CREATE INDEX IF NOT EXISTS idx_game_levels_difficulty ON game_levels(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_level_progress_user_id ON user_level_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_progress_game_id ON user_level_progress(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_level ON game_scores(game_id, level_number);
CREATE INDEX IF NOT EXISTS idx_game_scores_stars ON game_scores(stars);

-- RLS Policies for game_levels table (read-only for users)
ALTER TABLE game_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game levels are viewable by everyone"
  ON game_levels FOR SELECT
  USING (true);

-- RLS Policies for user_level_progress table
ALTER TABLE user_level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON user_level_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_level_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_level_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update user level progress
CREATE OR REPLACE FUNCTION update_user_level_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Calculate total stars
  IF NEW.stars IS NOT NULL THEN
    NEW.total_stars = (
      SELECT COALESCE(SUM((value::json->>'stars')::int), 0)
      FROM jsonb_each_text(NEW.stars)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating user level progress
CREATE TRIGGER update_user_level_progress_trigger
  BEFORE UPDATE ON user_level_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level_progress();

-- Function to check and unlock new levels
CREATE OR REPLACE FUNCTION check_level_unlock(
  p_user_id UUID,
  p_game_id VARCHAR(50),
  p_level_number INT,
  p_score INT,
  p_stars INT
) RETURNS JSONB AS $$
DECLARE
  v_next_level INT;
  v_unlock_requirement JSONB;
  v_unlocked_levels INT[];
  v_result JSONB;
BEGIN
  -- Get the next level
  v_next_level := p_level_number + 1;
  
  -- Get unlock requirement for next level
  SELECT unlock_requirement INTO v_unlock_requirement
  FROM game_levels
  WHERE game_id = p_game_id AND level_number = v_next_level;
  
  -- If no next level exists, return
  IF v_unlock_requirement IS NULL THEN
    RETURN jsonb_build_object('unlocked', false, 'message', 'No next level');
  END IF;
  
  -- Check if unlock requirements are met
  IF v_unlock_requirement->>'type' = 'stars' THEN
    IF p_stars >= (v_unlock_requirement->>'value')::int THEN
      -- Update unlocked levels
      UPDATE user_level_progress
      SET unlocked_levels = array_append(unlocked_levels, v_next_level)
      WHERE user_id = p_user_id AND game_id = p_game_id
      AND NOT (v_next_level = ANY(unlocked_levels))
      RETURNING unlocked_levels INTO v_unlocked_levels;
      
      IF FOUND THEN
        v_result := jsonb_build_object(
          'unlocked', true,
          'level', v_next_level,
          'message', 'Level ' || v_next_level || ' unlocked!'
        );
      ELSE
        v_result := jsonb_build_object('unlocked', false, 'message', 'Level already unlocked');
      END IF;
    ELSE
      v_result := jsonb_build_object(
        'unlocked', false,
        'message', 'Need ' || (v_unlock_requirement->>'value') || ' stars to unlock'
      );
    END IF;
  ELSIF v_unlock_requirement->>'type' = 'score' THEN
    IF p_score >= (v_unlock_requirement->>'value')::int THEN
      -- Update unlocked levels
      UPDATE user_level_progress
      SET unlocked_levels = array_append(unlocked_levels, v_next_level)
      WHERE user_id = p_user_id AND game_id = p_game_id
      AND NOT (v_next_level = ANY(unlocked_levels))
      RETURNING unlocked_levels INTO v_unlocked_levels;
      
      IF FOUND THEN
        v_result := jsonb_build_object(
          'unlocked', true,
          'level', v_next_level,
          'message', 'Level ' || v_next_level || ' unlocked!'
        );
      ELSE
        v_result := jsonb_build_object('unlocked', false, 'message', 'Level already unlocked');
      END IF;
    ELSE
      v_result := jsonb_build_object(
        'unlocked', false,
        'message', 'Score ' || (v_unlock_requirement->>'value') || ' required to unlock'
      );
    END IF;
  ELSE
    -- Default: unlock if current level completed
    UPDATE user_level_progress
    SET unlocked_levels = array_append(unlocked_levels, v_next_level)
    WHERE user_id = p_user_id AND game_id = p_game_id
    AND NOT (v_next_level = ANY(unlocked_levels))
    RETURNING unlocked_levels INTO v_unlocked_levels;
    
    IF FOUND THEN
      v_result := jsonb_build_object(
        'unlocked', true,
        'level', v_next_level,
        'message', 'Level ' || v_next_level || ' unlocked!'
      );
    ELSE
      v_result := jsonb_build_object('unlocked', false, 'message', 'Level already unlocked');
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Insert default level configurations for existing games
INSERT INTO game_levels (game_id, level_number, name, difficulty, config, unlock_requirement) VALUES
-- CPS Test Levels
('cps-test', 1, '5 Second Sprint', 'easy', '{"duration": 5, "target": 25}', NULL),
('cps-test', 2, '10 Second Standard', 'medium', '{"duration": 10, "target": 60}', '{"type": "stars", "value": 2, "previousLevel": 1}'),
('cps-test', 3, '30 Second Marathon', 'hard', '{"duration": 30, "target": 200}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('cps-test', 4, '60 Second Ultra', 'expert', '{"duration": 60, "target": 400}', '{"type": "stars", "value": 3, "previousLevel": 3}'),
('cps-test', 5, '100 Click Sprint', 'master', '{"clickTarget": 100, "mode": "sprint"}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Memory Match Levels
('memory-match', 1, 'Easy Grid', 'easy', '{"gridSize": "4x4", "pairs": 8, "timeLimit": null}', NULL),
('memory-match', 2, 'Medium Grid', 'medium', '{"gridSize": "6x6", "pairs": 18, "timeLimit": 180}', '{"type": "completion", "previousLevel": 1}'),
('memory-match', 3, 'Hard Grid', 'hard', '{"gridSize": "8x8", "pairs": 32, "timeLimit": 300}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('memory-match', 4, 'Expert Grid', 'expert', '{"gridSize": "8x8", "pairs": 32, "timeLimit": 240}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('memory-match', 5, 'Master Grid', 'master', '{"gridSize": "10x10", "pairs": 50, "flipLimit": 150}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Snake Levels
('snake', 1, 'Classic', 'easy', '{"speed": 1, "obstacles": false}', NULL),
('snake', 2, 'Speedy', 'medium', '{"speed": 1.5, "obstacles": false}', '{"type": "score", "value": 500}'),
('snake', 3, 'Maze Runner', 'hard', '{"speed": 1, "obstacles": true, "mazeLayout": 1}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('snake', 4, 'Portal Snake', 'expert', '{"speed": 1.2, "portals": true}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('snake', 5, 'Survival Mode', 'master', '{"speed": "progressive", "obstacles": true}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Typing Test Levels
('typing-test', 1, 'Beginner', 'easy', '{"wordType": "common", "targetWPM": 30, "duration": 60}', NULL),
('typing-test', 2, 'Intermediate', 'medium', '{"wordType": "sentences", "targetWPM": 50, "duration": 60}', '{"type": "score", "value": 30}'),
('typing-test', 3, 'Advanced', 'hard', '{"wordType": "paragraphs", "targetWPM": 70, "duration": 120}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('typing-test', 4, 'Expert', 'expert', '{"wordType": "technical", "targetWPM": 90, "duration": 120}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('typing-test', 5, 'Code Mode', 'master', '{"wordType": "code", "targetWPM": 60, "duration": 180}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- 2048 Levels
('2048', 1, 'Classic 2048', 'easy', '{"targetTile": 2048, "gridSize": 4}', NULL),
('2048', 2, 'Reach 4096', 'medium', '{"targetTile": 4096, "gridSize": 4}', '{"type": "score", "value": 2048}'),
('2048', 3, 'Reach 8192', 'hard', '{"targetTile": 8192, "gridSize": 4}', '{"type": "score", "value": 4096}'),
('2048', 4, '5x5 Grid', 'expert', '{"targetTile": 4096, "gridSize": 5}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('2048', 5, 'Time Attack', 'master', '{"targetTile": 2048, "gridSize": 4, "timeLimit": 300}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Sudoku Levels
('sudoku', 1, 'Easy', 'easy', '{"difficulty": "easy", "hints": 45}', NULL),
('sudoku', 2, 'Medium', 'medium', '{"difficulty": "medium", "hints": 35}', '{"type": "completion", "previousLevel": 1}'),
('sudoku', 3, 'Hard', 'hard', '{"difficulty": "hard", "hints": 28}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('sudoku', 4, 'Expert', 'expert', '{"difficulty": "expert", "hints": 22}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('sudoku', 5, 'Evil', 'master', '{"difficulty": "evil", "hints": 17}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Reaction Time Test Levels
('reaction-time', 1, 'Standard', 'easy', '{"rounds": 5, "mode": "standard"}', NULL),
('reaction-time', 2, 'Quick Fire', 'medium', '{"rounds": 10, "mode": "rapid"}', '{"type": "score", "value": 250}'),
('reaction-time', 3, 'Endurance', 'hard', '{"rounds": 20, "mode": "endurance"}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('reaction-time', 4, 'Random Delays', 'expert', '{"rounds": 15, "mode": "random", "minDelay": 500, "maxDelay": 5000}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('reaction-time', 5, 'Pro Mode', 'master', '{"rounds": 25, "mode": "pro", "targetTime": 200}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Tic-Tac-Toe Levels
('tic-tac-toe', 1, 'Easy AI', 'easy', '{"aiDifficulty": "easy", "boardSize": 3}', NULL),
('tic-tac-toe', 2, 'Medium AI', 'medium', '{"aiDifficulty": "medium", "boardSize": 3}', '{"type": "wins", "value": 3}'),
('tic-tac-toe', 3, 'Hard AI', 'hard', '{"aiDifficulty": "hard", "boardSize": 3}', '{"type": "wins", "value": 5, "previousLevel": 2}'),
('tic-tac-toe', 4, '4x4 Grid', 'expert', '{"aiDifficulty": "medium", "boardSize": 4}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('tic-tac-toe', 5, 'Ultimate', 'master', '{"aiDifficulty": "hard", "boardSize": 4, "winCondition": 4}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Minesweeper Levels
('minesweeper', 1, 'Beginner', 'easy', '{"width": 9, "height": 9, "mines": 10}', NULL),
('minesweeper', 2, 'Intermediate', 'medium', '{"width": 16, "height": 16, "mines": 40}', '{"type": "completion", "previousLevel": 1}'),
('minesweeper', 3, 'Expert', 'hard', '{"width": 30, "height": 16, "mines": 99}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('minesweeper', 4, 'Custom Large', 'expert', '{"width": 40, "height": 20, "mines": 150}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('minesweeper', 5, 'Extreme', 'master', '{"width": 50, "height": 25, "mines": 250}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Connect Four Levels
('connect-four', 1, 'Easy AI', 'easy', '{"aiDifficulty": "easy", "columns": 7, "rows": 6}', NULL),
('connect-four', 2, 'Medium AI', 'medium', '{"aiDifficulty": "medium", "columns": 7, "rows": 6}', '{"type": "wins", "value": 3}'),
('connect-four', 3, 'Hard AI', 'hard', '{"aiDifficulty": "hard", "columns": 7, "rows": 6}', '{"type": "wins", "value": 5, "previousLevel": 2}'),
('connect-four', 4, 'Larger Grid', 'expert', '{"aiDifficulty": "medium", "columns": 9, "rows": 7}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('connect-four', 5, 'Connect Five', 'master', '{"aiDifficulty": "hard", "columns": 10, "rows": 8, "connectTarget": 5}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Word Search Levels
('word-search', 1, 'Small Grid', 'easy', '{"gridSize": 10, "wordCount": 5, "timeLimit": null}', NULL),
('word-search', 2, 'Medium Grid', 'medium', '{"gridSize": 15, "wordCount": 8, "timeLimit": 300}', '{"type": "completion", "previousLevel": 1}'),
('word-search', 3, 'Large Grid', 'hard', '{"gridSize": 20, "wordCount": 12, "timeLimit": 480}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('word-search', 4, 'Theme Challenge', 'expert', '{"gridSize": 20, "wordCount": 15, "themed": true, "timeLimit": 600}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('word-search', 5, 'Speed Search', 'master', '{"gridSize": 25, "wordCount": 20, "timeLimit": 300}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Tetris Levels
('tetris', 1, 'Classic', 'easy', '{"startLevel": 0, "speed": 1}', NULL),
('tetris', 2, 'Faster Drop', 'medium', '{"startLevel": 5, "speed": 1.5}', '{"type": "score", "value": 5000}'),
('tetris', 3, 'Advanced Start', 'hard', '{"startLevel": 10, "speed": 2}', '{"type": "score", "value": 20000, "previousLevel": 2}'),
('tetris', 4, 'Ghost Pieces', 'expert', '{"startLevel": 15, "speed": 2.5, "ghostPiece": false}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('tetris', 5, 'Marathon', 'master', '{"startLevel": 20, "speed": 3, "endless": true}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Aim Trainer Levels
('aim-trainer', 1, 'Static Targets', 'easy', '{"targetCount": 20, "targetSize": "large", "movement": false}', NULL),
('aim-trainer', 2, 'Smaller Targets', 'medium', '{"targetCount": 30, "targetSize": "medium", "movement": false}', '{"type": "accuracy", "value": 70}'),
('aim-trainer', 3, 'Moving Targets', 'hard', '{"targetCount": 30, "targetSize": "medium", "movement": true, "speed": "slow"}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('aim-trainer', 4, 'Fast Moving', 'expert', '{"targetCount": 40, "targetSize": "small", "movement": true, "speed": "fast"}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('aim-trainer', 5, 'Precision Mode', 'master', '{"targetCount": 50, "targetSize": "tiny", "movement": true, "speed": "variable"}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Breakout Levels
('breakout', 1, 'Classic', 'easy', '{"rows": 5, "ballSpeed": 1, "paddleSize": "normal"}', NULL),
('breakout', 2, 'More Bricks', 'medium', '{"rows": 8, "ballSpeed": 1.2, "paddleSize": "normal"}', '{"type": "score", "value": 1000}'),
('breakout', 3, 'Fast Ball', 'hard', '{"rows": 8, "ballSpeed": 1.5, "paddleSize": "normal"}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('breakout', 4, 'Small Paddle', 'expert', '{"rows": 10, "ballSpeed": 1.5, "paddleSize": "small"}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('breakout', 5, 'Chaos Mode', 'master', '{"rows": 12, "ballSpeed": 2, "paddleSize": "small", "multiBall": true}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Mental Math Levels
('mental-math', 1, 'Addition', 'easy', '{"operations": ["add"], "difficulty": 1, "timePerQuestion": 10}', NULL),
('mental-math', 2, 'Mixed Basic', 'medium', '{"operations": ["add", "subtract"], "difficulty": 2, "timePerQuestion": 8}', '{"type": "score", "value": 500}'),
('mental-math', 3, 'Multiplication', 'hard', '{"operations": ["add", "subtract", "multiply"], "difficulty": 3, "timePerQuestion": 10}', '{"type": "stars", "value": 2, "previousLevel": 2}'),
('mental-math', 4, 'All Operations', 'expert', '{"operations": ["add", "subtract", "multiply", "divide"], "difficulty": 4, "timePerQuestion": 8}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('mental-math', 5, 'Speed Math', 'master', '{"operations": ["add", "subtract", "multiply", "divide"], "difficulty": 5, "timePerQuestion": 5}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Solitaire Levels
('solitaire', 1, 'Draw One', 'easy', '{"drawCount": 1, "scoring": "standard"}', NULL),
('solitaire', 2, 'Draw Three', 'medium', '{"drawCount": 3, "scoring": "standard"}', '{"type": "wins", "value": 1}'),
('solitaire', 3, 'Vegas Rules', 'hard', '{"drawCount": 3, "scoring": "vegas", "passes": 3}', '{"type": "wins", "value": 3, "previousLevel": 2}'),
('solitaire', 4, 'Timed Mode', 'expert', '{"drawCount": 3, "scoring": "standard", "timeLimit": 300}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('solitaire', 5, 'Perfect Game', 'master', '{"drawCount": 3, "scoring": "vegas", "moveLimit": 150}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Simon Says Levels
('simon-says', 1, 'Classic', 'easy', '{"startLength": 3, "speed": "normal", "colors": 4}', NULL),
('simon-says', 2, 'Faster', 'medium', '{"startLength": 4, "speed": "fast", "colors": 4}', '{"type": "score", "value": 8}'),
('simon-says', 3, 'More Colors', 'hard', '{"startLength": 4, "speed": "fast", "colors": 6}', '{"type": "score", "value": 15, "previousLevel": 2}'),
('simon-says', 4, 'Speed Demon', 'expert', '{"startLength": 5, "speed": "very_fast", "colors": 6}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('simon-says', 5, 'Memory Master', 'master', '{"startLength": 6, "speed": "extreme", "colors": 8}', '{"type": "stars", "value": 3, "previousLevel": 4}'),

-- Whack-a-Mole Levels
('whack-a-mole', 1, 'Slow Moles', 'easy', '{"moleSpeed": "slow", "moleCount": 30, "timeLimit": 60}', NULL),
('whack-a-mole', 2, 'Normal Speed', 'medium', '{"moleSpeed": "normal", "moleCount": 40, "timeLimit": 60}', '{"type": "score", "value": 20}'),
('whack-a-mole', 3, 'Fast Moles', 'hard', '{"moleSpeed": "fast", "moleCount": 50, "timeLimit": 60}', '{"type": "score", "value": 35, "previousLevel": 2}'),
('whack-a-mole', 4, 'Multi-Mole', 'expert', '{"moleSpeed": "fast", "moleCount": 60, "multiMole": true, "timeLimit": 60}', '{"type": "stars", "value": 2, "previousLevel": 3}'),
('whack-a-mole', 5, 'Frenzy Mode', 'master', '{"moleSpeed": "extreme", "moleCount": 100, "multiMole": true, "timeLimit": 90}', '{"type": "stars", "value": 3, "previousLevel": 4}')
ON CONFLICT (game_id, level_number) DO NOTHING;

-- Create view for leaderboards with level support
CREATE OR REPLACE VIEW level_leaderboards AS
SELECT 
  gs.game_id,
  gs.level_number,
  gl.name as level_name,
  gl.difficulty,
  gs.user_id,
  p.username,
  p.avatar_url,
  MAX(gs.score) as best_score,
  MAX(gs.stars) as best_stars,
  MIN(gs.created_at) as first_played,
  MAX(gs.created_at) as last_played,
  COUNT(*) as play_count
FROM game_scores gs
JOIN profiles p ON gs.user_id = p.id
LEFT JOIN game_levels gl ON gs.game_id = gl.game_id AND gs.level_number = gl.level_number
WHERE gs.level_number IS NOT NULL
GROUP BY gs.game_id, gs.level_number, gl.name, gl.difficulty, gs.user_id, p.username, p.avatar_url
ORDER BY gs.game_id, gs.level_number, best_score DESC;

-- Grant permissions
GRANT SELECT ON game_levels TO authenticated, anon;
GRANT ALL ON user_level_progress TO authenticated;
GRANT SELECT ON level_leaderboards TO authenticated, anon;