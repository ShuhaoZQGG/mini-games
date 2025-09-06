import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const gameColors: Record<string, { bg: string; accent: string }> = {
  'cps-test': { bg: '#3B82F6', accent: '#1E40AF' },
  'memory-match': { bg: '#8B5CF6', accent: '#6D28D9' },
  'typing-test': { bg: '#10B981', accent: '#047857' },
  'snake': { bg: '#22C55E', accent: '#15803D' },
  '2048': { bg: '#F59E0B', accent: '#D97706' },
  'sudoku': { bg: '#6366F1', accent: '#4338CA' },
  'reaction-time': { bg: '#EF4444', accent: '#B91C1C' },
  'tic-tac-toe': { bg: '#14B8A6', accent: '#0F766E' },
  'minesweeper': { bg: '#64748B', accent: '#334155' },
  'connect-four': { bg: '#F97316', accent: '#C2410C' },
  'word-search': { bg: '#A855F7', accent: '#7E22CE' },
  'tetris': { bg: '#EC4899', accent: '#BE185D' },
  'aim-trainer': { bg: '#DC2626', accent: '#991B1B' },
  'breakout': { bg: '#0EA5E9', accent: '#0369A1' },
  'mental-math': { bg: '#84CC16', accent: '#4D7C0F' },
};

const gameEmojis: Record<string, string> = {
  'cps-test': '👆',
  'memory-match': '🧠',
  'typing-test': '⌨️',
  'snake': '🐍',
  '2048': '🔢',
  'sudoku': '🔢',
  'reaction-time': '⚡',
  'tic-tac-toe': '❌',
  'minesweeper': '💣',
  'connect-four': '🔴',
  'word-search': '📝',
  'tetris': '🧱',
  'aim-trainer': '🎯',
  'breakout': '🧱',
  'mental-math': '🧮',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters
    const game = searchParams.get('game') || 'mini-games';
    const score = searchParams.get('score') || '0';
    const player = searchParams.get('player') || 'Player';
    const achievement = searchParams.get('achievement');
    const rank = searchParams.get('rank');
    const type = searchParams.get('type') || 'score'; // score, achievement, leaderboard, challenge

    // Get game-specific colors or defaults
    const colors = gameColors[game] || { bg: '#3B82F6', accent: '#1E40AF' };
    const emoji = gameEmojis[game] || '🎮';

    // Format game name
    const gameName = game.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`,
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.05) 10px,
                rgba(255, 255, 255, 0.05) 20px
              )`,
            }}
          />

          {/* Logo/Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '80px',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
              }}
            >
              {emoji}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '300',
                  color: 'rgba(255, 255, 255, 0.9)',
                  letterSpacing: '0.05em',
                }}
              >
                MINI GAMES
              </div>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                {gameName}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: 'white',
            }}
          >
            {type === 'score' && (
              <>
                <div
                  style={{
                    fontSize: '40px',
                    marginBottom: '20px',
                    opacity: 0.9,
                  }}
                >
                  {player} scored
                </div>
                <div
                  style={{
                    fontSize: '120px',
                    fontWeight: '800',
                    lineHeight: 1,
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))',
                  }}
                >
                  {score}
                </div>
                {rank && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '20px 40px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '100px',
                      fontSize: '32px',
                      fontWeight: '600',
                    }}
                  >
                    🏆 Rank #{rank}
                  </div>
                )}
              </>
            )}

            {type === 'achievement' && achievement && (
              <>
                <div
                  style={{
                    fontSize: '100px',
                    marginBottom: '30px',
                  }}
                >
                  🏆
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    marginBottom: '20px',
                    opacity: 0.9,
                  }}
                >
                  Achievement Unlocked!
                </div>
                <div
                  style={{
                    fontSize: '60px',
                    fontWeight: '700',
                    marginBottom: '20px',
                  }}
                >
                  {achievement}
                </div>
                <div
                  style={{
                    fontSize: '32px',
                    opacity: 0.8,
                  }}
                >
                  by {player}
                </div>
              </>
            )}

            {type === 'leaderboard' && (
              <>
                <div
                  style={{
                    fontSize: '100px',
                    marginBottom: '30px',
                  }}
                >
                  📊
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    marginBottom: '20px',
                    opacity: 0.9,
                  }}
                >
                  {player} is
                </div>
                <div
                  style={{
                    fontSize: '80px',
                    fontWeight: '700',
                    marginBottom: '20px',
                  }}
                >
                  #{rank || '1'} on Leaderboard
                </div>
                <div
                  style={{
                    fontSize: '32px',
                    opacity: 0.8,
                  }}
                >
                  Score: {score}
                </div>
              </>
            )}

            {type === 'challenge' && (
              <>
                <div
                  style={{
                    fontSize: '100px',
                    marginBottom: '30px',
                  }}
                >
                  ⚔️
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    marginBottom: '20px',
                    opacity: 0.9,
                  }}
                >
                  Challenge from
                </div>
                <div
                  style={{
                    fontSize: '60px',
                    fontWeight: '700',
                    marginBottom: '30px',
                  }}
                >
                  {player}
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    opacity: 0.8,
                  }}
                >
                  Can you beat {score}?
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '40px',
              borderTop: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              minigames.app
            </div>
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Play Now →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Failed to generate share image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}