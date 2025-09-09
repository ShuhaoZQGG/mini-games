import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://minigames.app';

const games = [
  'cps-test', 'memory-match', 'typing-test', 'snake', '2048', 'sudoku',
  'reaction-time', 'tic-tac-toe', 'minesweeper', 'connect-four', 'word-search',
  'tetris', 'aim-trainer', 'breakout', 'mental-math', 'solitaire', 'simon-says',
  'whack-a-mole', 'blackjack', 'video-poker', 'flappy-bird', 'stack-tower',
  'doodle-jump', 'jigsaw-puzzle', 'pac-man', 'space-invaders', 'pattern-memory',
  'color-switch', 'sliding-puzzle', 'crossword-puzzle', 'chess', 'pool',
  'checkers', 'battleship', 'air-hockey', 'go', 'reversi', 'backgammon',
  'dots-and-boxes', 'mahjong-solitaire'
];

const staticPages = [
  '',
  'leaderboard',
  'tournaments',
  'daily-challenge',
  'profile',
  'about',
  'privacy',
  'terms'
];

export async function GET() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${SITE_URL}${page ? `/${page}` : ''}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  ${games.map(game => `
  <url>
    <loc>${SITE_URL}/games/${game}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'
    }
  });
}