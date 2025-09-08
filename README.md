# Mini Games Platform

A high-performance web application featuring a collection of engaging mini-games with SEO optimization to attract organic traffic. Inspired by successful platforms like cpstest.org and chess.com.

## Core Features

### Game Collection
- **Click Speed Games**: CPS Test, Reaction Time Test, Aim Trainer
- **Puzzle Games**: Memory Match, Word Search, Sudoku, 2048
- **Strategy Games**: Tic-Tac-Toe, Connect Four, Minesweeper
- **Card Games**: Solitaire, Blackjack, Memory Card
- **Typing Games**: Typing Speed Test, Word Race
- **Math Games**: Mental Math, Number Sequence
- **Casual Games**: Snake, Tetris, Breakout

### Platform Features
- **Guest Access**: Play unlimited games without registration
- **Optional Authentication**: Create account for leaderboards and progress tracking
- **Global Leaderboards**: Compete with players worldwide
- **Personal Statistics**: Track performance and improvement
- **Social Sharing**: Share scores on social media
- **Responsive Design**: Mobile-first approach for all devices
- **Dark/Light Mode**: User preference theming
- **Multi-language Support**: i18n for global reach

### SEO & Performance
- **Server-Side Rendering**: Next.js SSR/SSG for optimal SEO
- **Meta Optimization**: Dynamic meta tags for each game
- **Structured Data**: Schema.org markup for rich snippets
- **Sitemap Generation**: Automatic XML sitemap
- **Performance Metrics**: Core Web Vitals optimization
- **CDN Integration**: Fast global content delivery
- **Image Optimization**: Next/Image for lazy loading
- **PWA Support**: Offline gameplay capability

### Technical Infrastructure
- **Real-time Updates**: Live leaderboards and multiplayer
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with social providers
- **File Storage**: Game assets and user avatars
- **Edge Functions**: Serverless game logic
- **Analytics**: Privacy-focused usage tracking
- **A/B Testing**: Feature flag system
- **Rate Limiting**: API protection

## Completed Features

### Games (18/15+ implemented - 120% MVP Complete)
- **CPS Test**: Click speed testing with real-time calculation
- **Memory Match**: Card matching game with emoji pairs
- **Typing Test**: WPM and accuracy testing
- **Snake**: Classic arcade game with touch controls
- **2048**: Number sliding puzzle with undo functionality
- **Sudoku**: Complete implementation with difficulty levels
- **Reaction Time Test**: Reflex speed measurement with statistics
- **Tic-Tac-Toe**: AI opponent with difficulty levels and PvP mode
- **Minesweeper**: Classic game with timer and difficulty settings
- **Connect Four**: Strategic dropping game with win detection
- **Word Search**: Find hidden words in letter grid
- **Tetris**: Classic block-stacking with scoring system
- **Aim Trainer**: Accuracy and reflex testing with moving targets
- **Breakout**: Classic arcade brick-breaking game
- **Mental Math**: Quick calculation challenges with difficulty scaling
- **Solitaire**: Classic card game with drag-and-drop mechanics
- **Simon Says**: Memory pattern game with increasing difficulty
- **Whack-a-Mole**: Reaction time game with speed progression

### Platform Features
- **Dark Mode**: System-aware theme toggle
- **Database Schema**: Supabase tables with RLS policies and migrations
- **Mobile Support**: Touch controls on all games
- **SEO Optimization**: Server-side rendering with meta tags
- **Authentication**: Optional sign-in with social providers configured
- **Score Persistence**: Service layer with localStorage fallback
- **Leaderboards**: Component built with period filtering
- **Tournament System**: Complete tournament management with history tracking
- **Spectator Mode**: Real-time game spectating with live chat
- **Friend System**: Social connections and friend-only leaderboards
- **Challenge System**: Head-to-head challenges between players
- **Achievement System**: Unlock rewards based on performance
- **Real-time Updates**: WebSocket/Supabase realtime integration
- **Production Config**: Environment templates and deployment scripts

## In Progress

- **Platform Enhancement Phase**: Focus on infrastructure and user experience
  - Connecting Supabase backend for persistent score storage
  - Implementing real-time leaderboard updates
  - Adding user profiles and achievements system
  - Social sharing and challenge features
  - PWA implementation for offline play
  - Performance monitoring and analytics integration

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deployment**: Vercel
- **Testing**: Jest, React Testing Library, Playwright

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.