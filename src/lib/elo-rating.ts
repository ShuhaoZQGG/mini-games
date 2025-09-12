// ELO Rating System Implementation

export class EloRating {
  private static readonly K_FACTOR = 32; // Standard K-factor for rating changes
  private static readonly INITIAL_RATING = 1200; // Starting rating for new players

  /**
   * Calculate new ratings after a match
   * @param winnerRating Current rating of the winner
   * @param loserRating Current rating of the loser
   * @returns New ratings for both players
   */
  static calculateNewRatings(
    winnerRating: number,
    loserRating: number
  ): { winnerNewRating: number; loserNewRating: number } {
    const expectedWinner = this.getExpectedScore(winnerRating, loserRating);
    const expectedLoser = this.getExpectedScore(loserRating, winnerRating);

    const winnerNewRating = Math.round(
      winnerRating + this.K_FACTOR * (1 - expectedWinner)
    );
    const loserNewRating = Math.round(
      loserRating + this.K_FACTOR * (0 - expectedLoser)
    );

    return {
      winnerNewRating: Math.max(100, winnerNewRating), // Minimum rating of 100
      loserNewRating: Math.max(100, loserNewRating)
    };
  }

  /**
   * Calculate ratings for a draw
   * @param player1Rating Rating of player 1
   * @param player2Rating Rating of player 2
   * @returns New ratings for both players
   */
  static calculateDrawRatings(
    player1Rating: number,
    player2Rating: number
  ): { player1NewRating: number; player2NewRating: number } {
    const expected1 = this.getExpectedScore(player1Rating, player2Rating);
    const expected2 = this.getExpectedScore(player2Rating, player1Rating);

    const player1NewRating = Math.round(
      player1Rating + this.K_FACTOR * (0.5 - expected1)
    );
    const player2NewRating = Math.round(
      player2Rating + this.K_FACTOR * (0.5 - expected2)
    );

    return {
      player1NewRating: Math.max(100, player1NewRating),
      player2NewRating: Math.max(100, player2NewRating)
    };
  }

  /**
   * Get expected score based on rating difference
   * @param playerRating Player's rating
   * @param opponentRating Opponent's rating
   * @returns Expected score (probability of winning)
   */
  private static getExpectedScore(
    playerRating: number,
    opponentRating: number
  ): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Get rating tier based on ELO rating
   * @param rating Player's ELO rating
   * @returns Rating tier name and color
   */
  static getRatingTier(rating: number): {
    name: string;
    color: string;
    icon: string;
  } {
    if (rating >= 2400) {
      return { name: 'Grandmaster', color: 'red', icon: '👑' };
    } else if (rating >= 2200) {
      return { name: 'Master', color: 'purple', icon: '🏆' };
    } else if (rating >= 2000) {
      return { name: 'Expert', color: 'orange', icon: '⭐' };
    } else if (rating >= 1800) {
      return { name: 'Diamond', color: 'cyan', icon: '💎' };
    } else if (rating >= 1600) {
      return { name: 'Platinum', color: 'blue', icon: '🔷' };
    } else if (rating >= 1400) {
      return { name: 'Gold', color: 'yellow', icon: '🥇' };
    } else if (rating >= 1200) {
      return { name: 'Silver', color: 'gray', icon: '🥈' };
    } else if (rating >= 1000) {
      return { name: 'Bronze', color: 'amber', icon: '🥉' };
    } else {
      return { name: 'Iron', color: 'stone', icon: '🔰' };
    }
  }

  /**
   * Calculate rating change preview
   * @param playerRating Player's current rating
   * @param opponentRating Opponent's rating
   * @returns Potential rating changes for win/loss/draw
   */
  static getMatchPreview(
    playerRating: number,
    opponentRating: number
  ): {
    winChange: number;
    lossChange: number;
    drawChange: number;
  } {
    const { winnerNewRating, loserNewRating } = this.calculateNewRatings(
      playerRating,
      opponentRating
    );
    const { player1NewRating } = this.calculateDrawRatings(
      playerRating,
      opponentRating
    );

    return {
      winChange: winnerNewRating - playerRating,
      lossChange: loserNewRating - opponentRating,
      drawChange: player1NewRating - playerRating
    };
  }

  /**
   * Get initial rating for new players
   */
  static getInitialRating(): number {
    return this.INITIAL_RATING;
  }

  /**
   * Calculate provisional rating (for players with < 10 games)
   * Uses higher K-factor for faster rating adjustments
   */
  static calculateProvisionalRating(
    currentRating: number,
    opponentRating: number,
    result: 'win' | 'loss' | 'draw',
    gamesPlayed: number
  ): number {
    const provisionalK = Math.max(this.K_FACTOR * 2, 64 - gamesPlayed * 3);
    const expected = this.getExpectedScore(currentRating, opponentRating);
    
    let actualScore: number;
    switch (result) {
      case 'win':
        actualScore = 1;
        break;
      case 'loss':
        actualScore = 0;
        break;
      case 'draw':
        actualScore = 0.5;
        break;
    }

    const newRating = Math.round(
      currentRating + provisionalK * (actualScore - expected)
    );

    return Math.max(100, newRating);
  }

  /**
   * Format rating for display
   * @param rating ELO rating
   * @returns Formatted string with tier
   */
  static formatRating(rating: number): string {
    const tier = this.getRatingTier(rating);
    return `${tier.icon} ${rating} (${tier.name})`;
  }

  /**
   * Calculate matchmaking range based on rating
   * @param rating Player's rating
   * @param strictness How strict the matching should be (0-1)
   * @returns Min and max rating for matchmaking
   */
  static getMatchmakingRange(
    rating: number,
    strictness: number = 0.5
  ): { min: number; max: number } {
    const baseRange = 400;
    const adjustedRange = baseRange * (1 - strictness);
    
    return {
      min: Math.max(100, rating - adjustedRange),
      max: rating + adjustedRange
    };
  }

  /**
   * Check if rematch should adjust K-factor
   * (Lower K-factor for rematches to prevent rating manipulation)
   */
  static getRematchKFactor(rematchCount: number): number {
    return Math.max(8, this.K_FACTOR - rematchCount * 4);
  }
}