-- Categories table for organizing games
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game metadata table for enhanced game information
CREATE TABLE IF NOT EXISTS game_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[],
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  avg_play_time INT, -- minutes
  player_count TEXT,
  thumbnail_url TEXT,
  description TEXT,
  play_count INT DEFAULT 0,
  rating DECIMAL(2,1),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  favorite_games TEXT[],
  preferred_categories UUID[],
  last_played_games JSONB,
  play_statistics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game play history for tracking
CREATE TABLE IF NOT EXISTS game_play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  session_duration INT, -- seconds
  score INT,
  level_reached INT,
  played_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_metadata_category ON game_metadata(category_id);
CREATE INDEX idx_game_metadata_slug ON game_metadata(slug);
CREATE INDEX idx_game_metadata_featured ON game_metadata(featured);
CREATE INDEX idx_game_play_history_user ON game_play_history(user_id);
CREATE INDEX idx_game_play_history_game ON game_play_history(game_slug);

-- Insert initial categories
INSERT INTO categories (slug, name, icon, color, description, display_order) VALUES
  ('quick-games', 'Quick Games', '⚡', '#10B981', 'Fast-paced games under 5 minutes', 1),
  ('puzzle-games', 'Puzzle Games', '🧩', '#8B5CF6', 'Brain teasers and logic challenges', 2),
  ('card-games', 'Card Games', '🃏', '#EF4444', 'Classic card games and variations', 3),
  ('strategy-games', 'Strategy Games', '♟️', '#3B82F6', 'Games requiring planning and tactics', 4),
  ('arcade-classics', 'Arcade Classics', '👾', '#F59E0B', 'Retro arcade favorites', 5),
  ('skill-reflex', 'Skill & Reflex', '🎯', '#06B6D4', 'Test your reflexes and accuracy', 6),
  ('memory-games', 'Memory Games', '🧠', '#EC4899', 'Challenge your memory skills', 7),
  ('board-games', 'Board Games', '🎲', '#84CC16', 'Digital board game adaptations', 8),
  ('casual-games', 'Casual Games', '🎮', '#FB923C', 'Relaxing and fun games', 9),
  ('word-games', 'Word Games', '📝', '#6366F1', 'Vocabulary and word puzzles', 10);

-- Insert game metadata for existing games
INSERT INTO game_metadata (slug, name, category_id, tags, difficulty, avg_play_time, player_count, description) VALUES
  -- Quick Games
  ('cps-test', 'CPS Test', (SELECT id FROM categories WHERE slug = 'quick-games'), ARRAY['speed', 'clicking', 'reflex'], 'easy', 1, '1', 'Test your clicking speed'),
  ('reaction-time', 'Reaction Time Test', (SELECT id FROM categories WHERE slug = 'quick-games'), ARRAY['speed', 'reflex'], 'easy', 1, '1', 'Measure your reaction speed'),
  ('whack-a-mole', 'Whack-a-Mole', (SELECT id FROM categories WHERE slug = 'quick-games'), ARRAY['speed', 'reflex', 'arcade'], 'easy', 3, '1', 'Classic whack-a-mole game'),
  
  -- Puzzle Games
  ('sudoku', 'Sudoku', (SELECT id FROM categories WHERE slug = 'puzzle-games'), ARRAY['logic', 'numbers', 'classic'], 'hard', 20, '1', 'Classic number puzzle'),
  ('2048', '2048', (SELECT id FROM categories WHERE slug = 'puzzle-games'), ARRAY['numbers', 'sliding', 'strategy'], 'medium', 10, '1', 'Slide tiles to reach 2048'),
  ('crossword', 'Crossword Puzzle', (SELECT id FROM categories WHERE slug = 'puzzle-games'), ARRAY['words', 'vocabulary'], 'medium', 25, '1', 'Solve word clues'),
  ('sliding-puzzle', 'Sliding Puzzle', (SELECT id FROM categories WHERE slug = 'puzzle-games'), ARRAY['sliding', 'logic'], 'medium', 15, '1', '15-puzzle game'),
  ('jigsaw-puzzle', 'Jigsaw Puzzle', (SELECT id FROM categories WHERE slug = 'puzzle-games'), ARRAY['visual', 'patience'], 'medium', 20, '1', 'Piece together the picture'),
  
  -- Card Games
  ('solitaire', 'Solitaire', (SELECT id FROM categories WHERE slug = 'card-games'), ARRAY['classic', 'patience', 'single-player'], 'medium', 15, '1', 'Classic card patience game'),
  ('blackjack', 'Blackjack', (SELECT id FROM categories WHERE slug = 'card-games'), ARRAY['casino', 'strategy'], 'medium', 10, '1', 'Beat the dealer at 21'),
  ('video-poker', 'Video Poker', (SELECT id FROM categories WHERE slug = 'card-games'), ARRAY['casino', 'poker'], 'medium', 10, '1', 'Jacks or Better poker'),
  
  -- Strategy Games
  ('chess', 'Chess', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['classic', 'board', 'tactical'], 'hard', 30, '2', 'The ultimate strategy game'),
  ('checkers', 'Checkers', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['board', 'classic'], 'medium', 15, '2', 'Classic board game'),
  ('connect-four', 'Connect Four', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['board', 'tactical'], 'easy', 10, '2', 'Connect four in a row'),
  ('tic-tac-toe', 'Tic-Tac-Toe', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['classic', 'simple'], 'easy', 3, '1-2', 'Classic X and O game'),
  ('go', 'Go', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['board', 'territorial', 'complex'], 'hard', 45, '2', 'Ancient territorial game'),
  ('reversi', 'Reversi', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['board', 'flipping'], 'medium', 15, '2', 'Flip your way to victory'),
  ('backgammon', 'Backgammon', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['board', 'dice', 'classic'], 'medium', 20, '2', 'Race and bear off'),
  ('dots-and-boxes', 'Dots and Boxes', (SELECT id FROM categories WHERE slug = 'strategy-games'), ARRAY['paper', 'territorial'], 'easy', 10, '2', 'Claim the most boxes'),
  
  -- Arcade Classics
  ('pac-man', 'Pac-Man', (SELECT id FROM categories WHERE slug = 'arcade-classics'), ARRAY['retro', 'maze', 'ghosts'], 'medium', 10, '1', 'Eat dots, avoid ghosts'),
  ('space-invaders', 'Space Invaders', (SELECT id FROM categories WHERE slug = 'arcade-classics'), ARRAY['retro', 'shooter', 'aliens'], 'medium', 10, '1', 'Defend Earth from invaders'),
  ('breakout', 'Breakout', (SELECT id FROM categories WHERE slug = 'arcade-classics'), ARRAY['retro', 'paddle', 'bricks'], 'easy', 10, '1', 'Break all the bricks'),
  ('tetris', 'Tetris', (SELECT id FROM categories WHERE slug = 'arcade-classics'), ARRAY['retro', 'falling-blocks', 'classic'], 'medium', 15, '1', 'Arrange falling blocks'),
  ('snake', 'Snake', (SELECT id FROM categories WHERE slug = 'arcade-classics'), ARRAY['retro', 'growing', 'classic'], 'easy', 5, '1', 'Grow without hitting walls'),
  
  -- Skill & Reflex
  ('aim-trainer', 'Aim Trainer', (SELECT id FROM categories WHERE slug = 'skill-reflex'), ARRAY['accuracy', 'speed', 'training'], 'medium', 5, '1', 'Improve your aim accuracy'),
  ('typing-test', 'Typing Test', (SELECT id FROM categories WHERE slug = 'skill-reflex'), ARRAY['typing', 'speed', 'accuracy'], 'medium', 3, '1', 'Test your typing speed'),
  ('color-switch', 'Color Switch', (SELECT id FROM categories WHERE slug = 'skill-reflex'), ARRAY['timing', 'colors', 'reflex'], 'medium', 5, '1', 'Match the colors quickly'),
  
  -- Memory Games
  ('memory-match', 'Memory Match', (SELECT id FROM categories WHERE slug = 'memory-games'), ARRAY['cards', 'pairs', 'concentration'], 'easy', 5, '1', 'Match card pairs'),
  ('simon-says', 'Simon Says', (SELECT id FROM categories WHERE slug = 'memory-games'), ARRAY['sequence', 'pattern', 'classic'], 'medium', 5, '1', 'Follow the pattern'),
  ('pattern-memory', 'Pattern Memory', (SELECT id FROM categories WHERE slug = 'memory-games'), ARRAY['sequence', 'visual'], 'medium', 5, '1', 'Remember the sequence'),
  
  -- Board Games
  ('battleship', 'Battleship', (SELECT id FROM categories WHERE slug = 'board-games'), ARRAY['naval', 'strategy', 'guessing'], 'medium', 20, '2', 'Sink enemy ships'),
  ('mahjong-solitaire', 'Mahjong Solitaire', (SELECT id FROM categories WHERE slug = 'board-games'), ARRAY['tiles', 'matching', 'patience'], 'medium', 20, '1', 'Match and clear tiles'),
  ('minesweeper', 'Minesweeper', (SELECT id FROM categories WHERE slug = 'board-games'), ARRAY['logic', 'mines', 'classic'], 'medium', 10, '1', 'Clear mines safely'),
  
  -- Casual Games
  ('flappy-bird', 'Flappy Bird', (SELECT id FROM categories WHERE slug = 'casual-games'), ARRAY['flying', 'endless', 'tapping'], 'easy', 5, '1', 'Navigate through pipes'),
  ('doodle-jump', 'Doodle Jump', (SELECT id FROM categories WHERE slug = 'casual-games'), ARRAY['jumping', 'endless', 'platforms'], 'easy', 5, '1', 'Jump higher and higher'),
  ('stack-tower', 'Stack Tower', (SELECT id FROM categories WHERE slug = 'casual-games'), ARRAY['stacking', 'precision', 'endless'], 'easy', 5, '1', 'Stack blocks perfectly'),
  ('air-hockey', 'Air Hockey', (SELECT id FROM categories WHERE slug = 'casual-games'), ARRAY['sports', 'arcade', 'competitive'], 'easy', 10, '2', 'Score goals with the puck'),
  ('pool', 'Pool', (SELECT id FROM categories WHERE slug = 'casual-games'), ARRAY['sports', 'billiards', '8-ball'], 'medium', 15, '2', '8-ball billiards'),
  
  -- Word Games
  ('word-search', 'Word Search', (SELECT id FROM categories WHERE slug = 'word-games'), ARRAY['words', 'finding', 'puzzle'], 'easy', 10, '1', 'Find hidden words'),
  ('mental-math', 'Mental Math', (SELECT id FROM categories WHERE slug = 'word-games'), ARRAY['math', 'calculation', 'speed'], 'medium', 5, '1', 'Quick math challenges');

-- Update games as featured (popular ones)
UPDATE game_metadata SET featured = true WHERE slug IN ('chess', '2048', 'snake', 'tetris', 'cps-test', 'pac-man');

-- RLS policies for new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_play_history ENABLE ROW LEVEL SECURITY;

-- Categories and game_metadata are public read
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Game metadata is viewable by everyone" ON game_metadata
  FOR SELECT USING (true);

-- User preferences are private to each user
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Game play history is private to each user
CREATE POLICY "Users can view own play history" ON game_play_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own play history" ON game_play_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);