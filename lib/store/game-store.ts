import { create } from 'zustand';

interface GameState {
  scores: Record<string, number>;
  updateScore: (game: string, score: number) => void;
  getHighScore: (game: string) => number;
}

export const useGameStore = create<GameState>((set, get) => ({
  scores: {},
  
  updateScore: (game: string, score: number) => {
    set((state) => {
      const currentScore = state.scores[game] || 0;
      if (score > currentScore) {
        return {
          scores: {
            ...state.scores,
            [game]: score,
          },
        };
      }
      return state;
    });
  },
  
  getHighScore: (game: string) => {
    return get().scores[game] || 0;
  },
}));