-- Add new games to game_metadata table
-- Pinball and Nonogram games

INSERT INTO game_metadata (slug, name, category_id, tags, difficulty, avg_play_time, player_count, description) VALUES
  -- Arcade Classics
  ('pinball', 'Pinball', (SELECT id FROM categories WHERE slug = 'arcade-classics'), ARRAY['arcade', 'physics', 'flippers'], 'medium', 10, '1', 'Classic pinball with flippers and bumpers'),
  
  -- Puzzle Games  
  ('nonogram', 'Nonogram', (SELECT id FROM categories WHERE slug = 'puzzle-games'), ARRAY['logic', 'picture', 'grid'], 'medium', 15, '1', 'Picture logic puzzles')
ON CONFLICT (slug) DO NOTHING;