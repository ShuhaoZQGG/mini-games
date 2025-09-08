export const gameLevels = {
  '2048': [
    { id: 1, name: 'Beginner', difficulty: 'easy', config: { targetScore: 512, gridSize: 4 }, requiredStars: 0 },
    { id: 2, name: 'Normal', difficulty: 'medium', config: { targetScore: 1024, gridSize: 4 }, requiredStars: 2 },
    { id: 3, name: 'Advanced', difficulty: 'hard', config: { targetScore: 2048, gridSize: 4 }, requiredStars: 5 },
    { id: 4, name: 'Expert', difficulty: 'expert', config: { targetScore: 4096, gridSize: 5 }, requiredStars: 8 },
    { id: 5, name: 'Master', difficulty: 'master', config: { targetScore: 8192, gridSize: 5 }, requiredStars: 12 }
  ],
  'tetris': [
    { id: 1, name: 'Slow Drop', difficulty: 'easy', config: { speed: 1000, targetLines: 10 }, requiredStars: 0 },
    { id: 2, name: 'Normal Speed', difficulty: 'medium', config: { speed: 700, targetLines: 20 }, requiredStars: 2 },
    { id: 3, name: 'Fast Drop', difficulty: 'hard', config: { speed: 400, targetLines: 30 }, requiredStars: 5 },
    { id: 4, name: 'Lightning', difficulty: 'expert', config: { speed: 200, targetLines: 40 }, requiredStars: 8 },
    { id: 5, name: 'Insane', difficulty: 'master', config: { speed: 100, targetLines: 50 }, requiredStars: 12 }
  ],
  'reaction-time': [
    { id: 1, name: 'Relaxed', difficulty: 'easy', config: { rounds: 3, maxDelay: 5000 }, requiredStars: 0 },
    { id: 2, name: 'Standard', difficulty: 'medium', config: { rounds: 5, maxDelay: 4000 }, requiredStars: 2 },
    { id: 3, name: 'Quick', difficulty: 'hard', config: { rounds: 5, maxDelay: 3000 }, requiredStars: 5 },
    { id: 4, name: 'Lightning', difficulty: 'expert', config: { rounds: 7, maxDelay: 2500 }, requiredStars: 8 },
    { id: 5, name: 'Superhuman', difficulty: 'master', config: { rounds: 10, maxDelay: 2000 }, requiredStars: 12 }
  ],
  'typing-test': [
    { id: 1, name: 'Beginner', difficulty: 'easy', config: { duration: 60, minWPM: 20 }, requiredStars: 0 },
    { id: 2, name: 'Intermediate', difficulty: 'medium', config: { duration: 60, minWPM: 40 }, requiredStars: 2 },
    { id: 3, name: 'Advanced', difficulty: 'hard', config: { duration: 45, minWPM: 60 }, requiredStars: 5 },
    { id: 4, name: 'Expert', difficulty: 'expert', config: { duration: 30, minWPM: 80 }, requiredStars: 8 },
    { id: 5, name: 'Professional', difficulty: 'master', config: { duration: 30, minWPM: 100 }, requiredStars: 12 }
  ]
}