# UI/UX Design Specifications - Mini Games Platform (Cycle 12)

## Executive Summary
Comprehensive UI/UX design for tournament features, spectator mode, and three new games (Solitaire, Simon Says, Whack-a-Mole) to enhance user engagement and platform growth.

## Visual Identity

### Brand Principles
- **Playful**: Vibrant, engaging, fun without being childish
- **Accessible**: Clear contrast, readable fonts, intuitive navigation
- **Fast**: Instant feedback, smooth animations, quick load times
- **Responsive**: Seamless experience across all devices
- **Competitive**: Tournament-focused with social viewing features

### Color System
```css
--primary: #6366f1        /* Indigo - CTAs, active states */
--primary-hover: #4f46e5  /* Darker indigo for hover */
--secondary: #8b5cf6      /* Purple - achievements, rewards */
--accent: #ec4899         /* Pink - highlights, notifications */
--success: #10b981        /* Green - wins, correct answers */
--warning: #f59e0b        /* Amber - time warnings, hints */
--danger: #ef4444         /* Red - errors, game over */
--background: #ffffff     /* White - main background */
--surface: #f9fafb        /* Light gray - cards, panels */
--text-primary: #111827   /* Dark gray - main text */
--text-secondary: #6b7280 /* Medium gray - secondary text */

/* Dark Mode */
--dark-background: #0f172a
--dark-surface: #1e293b
--dark-text-primary: #f1f5f9
--dark-text-secondary: #94a3b8
```

### Typography
- **Headings**: Inter (600-800 weight)
- **Body**: Inter (400-500 weight)
- **Game UI**: Orbitron (scores, timers)
- **Sizes**: 14px base, 1.5 line-height

## Layout Architecture

### Navigation Structure
```
Header (sticky, 64px)
├── Logo + Brand
├── Game Categories Dropdown
├── Search (expandable)
├── Theme Toggle
└── User Menu / Sign In

Main Content
├── Hero Section (home only)
├── Game Grid / Game Area
├── Leaderboards Sidebar
└── Social Feed (authenticated)

Footer
├── Game Categories
├── Platform Links
├── Social Links
└── Legal
```

### Responsive Breakpoints
- **Mobile**: 320-768px (single column, bottom nav)
- **Tablet**: 768-1024px (2 columns, side drawer)
- **Desktop**: 1024px+ (3 columns, full sidebar)

## User Journeys

### Guest User Flow
```
Landing Page
├── Featured Games Carousel
├── Popular Games Grid
├── Live Leaderboard Preview
└── "Play as Guest" CTA

Game Selection
├── Category Filter
├── Difficulty Badge
├── Play Count
└── Best Score Preview

Gameplay
├── Instant Start (no loading)
├── Tutorial Overlay (first time)
├── Real-time Score
└── Share Score Prompt

Post-Game
├── Score Summary
├── Leaderboard Position
├── "Beat This Score" Share
└── Sign Up Prompt (after 3 games)
```

### Authenticated User Flow
```
Dashboard
├── Continue Playing
├── Daily Challenges
├── Friend Activity
└── Achievement Progress

Profile
├── Avatar + Username
├── Total Score + Rank
├── Game Statistics
├── Achievement Showcase
└── Friend List

Social Features
├── Challenge Friends
├── Share Achievements
├── Tournament Entry
└── Activity Feed
```

## Component Design

### Game Card
```
┌─────────────────────┐
│ [Game Thumbnail]    │
│                     │
├─────────────────────┤
│ Game Title          │
│ ★4.5 | 1.2M plays   │
│ Your Best: 2,450    │
│ [Play Now]          │
└─────────────────────┘
```

### Leaderboard Widget
```
┌─────────────────────┐
│ Top Scores | Today ▼│
├─────────────────────┤
│ 🥇 User1    12,450  │
│ 🥈 User2    11,200  │
│ 🥉 User3    10,900  │
│ ...                 │
│ 42. You      5,200  │
├─────────────────────┤
│ [View Full]         │
└─────────────────────┘
```

### Game Interface
```
┌──────────────────────────┐
│ Score: 1,250  Time: 0:45 │
├──────────────────────────┤
│                          │
│      [Game Canvas]       │
│                          │
├──────────────────────────┤
│ [Pause] [Restart] [Exit] │
└──────────────────────────┘
```

## Game-Specific UI

### CPS Test
- Large click area with ripple effect
- Real-time CPS counter
- Progress bar for time remaining
- Click streak indicator

### Memory Match
- 3D card flip animation
- Match celebration animation
- Timer with warning states
- Moves counter

### Typing Test
- Text highlight for current word
- WPM speedometer visualization
- Accuracy percentage badge
- Error highlighting

### Snake
- Gradient snake body
- Food pulse animation
- Score multiplier display
- Speed indicator

### 2048
- Smooth tile slide animations
- Number merge effects
- Undo button with count
- Best score comparison

### Puzzle Games (Sudoku, Minesweeper)
- Cell hover highlights
- Validation indicators
- Hint system UI
- Timer with pause

### Competitive Games (Tic-Tac-Toe, Connect Four)
- Turn indicator
- Win line animation
- AI difficulty selector
- Move history

## Animation & Interactions

### Micro-interactions
- **Button Hover**: Scale 1.05, shadow elevation
- **Card Hover**: Lift effect with shadow
- **Score Update**: Number roll animation
- **Achievement Unlock**: Slide in + confetti
- **Error State**: Subtle shake animation

### Page Transitions
- **Route Change**: Fade with 200ms
- **Modal Open**: Scale + fade 300ms
- **Drawer Slide**: 250ms ease-out
- **Tab Switch**: Slide horizontal 200ms

### Game Animations
- **Start Countdown**: 3-2-1-GO pulse
- **Score Increase**: +points float up
- **Game Over**: Overlay fade in
- **New High Score**: Celebration burst

## Mobile Optimizations

### Touch Targets
- Minimum 44x44px tap areas
- 8px spacing between targets
- Gesture support (swipe, pinch)
- Haptic feedback on actions

### Mobile Navigation
```
Bottom Tab Bar (fixed)
├── Home
├── Categories
├── Leaderboard
├── Profile
└── More
```

### Game Controls
- Virtual joystick for Snake
- Swipe gestures for 2048
- Touch-optimized buttons
- Landscape mode support

## Accessibility Features

### WCAG 2.1 AA Compliance
- Color contrast ratio 4.5:1 minimum
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader announcements

### Game Accessibility
- Colorblind modes
- Reduced motion option
- Adjustable game speed
- Audio cues toggle
- High contrast mode

## Loading & Error States

### Loading States
```
Skeleton Screen
├── Header (static)
├── Content shimmer
├── Progressive reveal
└── Estimated time
```

### Error Handling
```
Error Display
├── Friendly message
├── Retry action
├── Report issue link
└── Fallback content
```

## Social Sharing Templates

### Score Share Card
```
┌─────────────────────┐
│ I scored 12,450!    │
│ on [Game Name]      │
│                     │
│ [Game Screenshot]   │
│                     │
│ Can you beat it?    │
│ play.minigames.com  │
└─────────────────────┘
```

## PWA Features

### Offline UI
- Cached game availability badges
- Offline score queue indicator
- Sync status in header
- Download progress for games

### Install Prompt
```
┌─────────────────────┐
│ Install Mini Games  │
│ Play offline!       │
│ [Install] [Later]   │
└─────────────────────┘
```

## Performance Budgets

### Initial Load
- First Paint: <1s
- Interactive: <3s
- Full Load: <5s

### Runtime Performance
- 60 FPS animations
- <100ms input latency
- <50ms score updates

## Implementation Priority

### Phase 1: Core Platform
1. Navigation system
2. Game cards grid
3. Basic leaderboards
4. Guest gameplay flow

### Phase 2: User Features
1. Authentication UI
2. User profiles
3. Score persistence
4. Social sharing

### Phase 3: Engagement
1. Achievements UI
2. Daily challenges
3. Tournament brackets
4. Friend system

### Phase 4: Polish
1. Advanced animations
2. PWA features
3. Offline mode
4. Push notifications

## Design System Components

### Using Supabase Auth UI
- Pre-built Auth component for sign-in/up
- Social provider buttons (Google, GitHub, Discord)
- Magic link email authentication
- Password reset flow

### Component Library
- shadcn/ui base components
- Custom game-specific components
- Framer Motion for animations
- React Query for data fetching

## Responsive Design Patterns

### Mobile-First Approach
```tsx
// Base mobile styles
className="grid grid-cols-1 gap-4 
          md:grid-cols-2 
          lg:grid-cols-3 
          xl:grid-cols-4"
```

### Container Queries
```css
@container (min-width: 400px) {
  .game-card { flex-direction: row; }
}
```

## State Management UI

### Loading States
- Skeleton screens for content
- Spinner for actions
- Progress bars for uploads
- Optimistic updates

### Error Recovery
- Inline error messages
- Toast notifications
- Retry mechanisms
- Fallback UI

## Tournament UI Specifications

### Tournament History Page
```
┌─────────────────────────────────────────────────────────┐
│  Tournament History                     [Filter ▼]      │
├─────────────────────────────────────────────────────────┤
│  Stats Overview                                        │
│  ├─ Total Tournaments: 24                             │
│  ├─ Win Rate: 45%                                     │
│  ├─ Best Placement: 1st                               │
│  └─ Total Winnings: $450                              │
├─────────────────────────────────────────────────────────┤
│  Recent Tournaments                                    │
│  ┌────────────────────────────────────┐               │
│  │ Spring CPS Championship      [1st] │               │
│  │ March 15, 2025 • 32 players       │               │
│  │ Won 5/5 matches • Prize: $100     │               │
│  └────────────────────────────────────┘               │
│  ┌────────────────────────────────────┐               │
│  │ Weekly Snake Tournament      [3rd] │               │
│  │ March 10, 2025 • 16 players       │               │
│  │ Won 3/4 matches • Prize: $25      │               │
│  └────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Private Tournament Creation
```
┌─────────────────────────────────────────────────────────┐
│  Create Private Tournament                             │
├─────────────────────────────────────────────────────────┤
│  Tournament Name: [___________________]                │
│  Game: [Select Game ▼]                                │
│  Format: [Single Elimination ▼]                       │
│  Max Players: [8] [16] [32] [64]                     │
│  Entry Fee: [$0] [$5] [$10] [Custom]                 │
│  Start Time: [Date Picker] [Time Picker]              │
│  ☐ Friends Only                                       │
│  ☐ Password Protected                                 │
│  Invite Code: [Auto-generated]                        │
│  [Create Tournament]                                   │
└─────────────────────────────────────────────────────────┘
```

### Friend-Only Leaderboards
```
┌─────────────────────────────────────────────────────────┐
│  Leaderboards     [Global] [Friends] [Local]           │
├─────────────────────────────────────────────────────────┤
│  Friends Leaderboard - CPS Test                        │
│  ┌─────────────────────────────────────┐              │
│  │ 1. 👤 BestFriend      156 CPS      │              │
│  │ 2. 👤 You             142 CPS      │              │
│  │ 3. 👤 Friend2         134 CPS      │              │
│  │ 4. 👤 Friend3         128 CPS      │              │
│  └─────────────────────────────────────┘              │
│  [Challenge Friend] [Share Achievement]                │
└─────────────────────────────────────────────────────────┘
```

## Spectator Mode Design

### Live Spectator View
```
┌─────────────────────────────────────────────────────────┐
│  🔴 LIVE • Tournament Match                            │
│  Player1 vs Player2 • Round of 16                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  Game View  ┌─────────────┐         │
│  │  Player1    │             │  Player2    │         │
│  │  Score: 87  │  [Canvas]   │  Score: 92  │         │
│  │  Combo: x3  │             │  Combo: x2  │         │
│  └─────────────┘             └─────────────┘         │
│                                                        │
│  Time: 00:45 / 01:00                                  │
│  👁 234 viewers • 💬 Chat (42)                        │
├─────────────────────────────────────────────────────────┤
│  [Exit] [Share Stream] [Follow Player] [Report]       │
└─────────────────────────────────────────────────────────┘
```

### Spectator Chat Overlay
```
┌──────────────────────┐
│ Live Chat            │
├──────────────────────┤
│ User1: Great match!  │
│ User2: Go Player1!   │
│ User3: Close game    │
│ [Type message...]    │
└──────────────────────┘
```

## New Game Designs

### Solitaire (Klondike) - Full UI
```
┌─────────────────────────────────────────────────────────┐
│  Solitaire              Score: 500   Time: 03:45       │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐       │
│  │ [Stock] [Waste]    [♠A] [♥A] [♦A] [♣A]    │       │
│  │  (24)    K♦                                │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  Tableau (Drag & Drop Enabled):                       │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐              │
│  │K♠│ │??│ │??│ │??│ │??│ │??│ │??│              │
│  └┬─┘ │Q♥│ │??│ │??│ │??│ │??│ │??│              │
│   │   └┬─┘ │J♣│ │??│ │??│ │??│ │??│              │
│   │    │   └┬─┘ │10♦│ │??│ │??│ │??│              │
│   │    │    │   └┬──┘ │9♠│ │??│ │??│              │
│   │    │    │    │    └┬─┘ │8♥│ │??│              │
│   │    │    │    │     │   └┬─┘ │7♣│              │
│   │    │    │    │     │    │   └──┘              │
├─────────────────────────────────────────────────────────┤
│  [New Game] [Undo] [Hint] [Auto-Complete]             │
└─────────────────────────────────────────────────────────┘
```

### Simon Says - Interactive Design
```
┌─────────────────────────────────────────────────────────┐
│  Simon Says            Round: 5    Best: 12           │
├─────────────────────────────────────────────────────────┤
│                                                        │
│        ┌───────────────┬───────────────┐              │
│        │               │               │              │
│        │    GREEN      │      RED      │              │
│        │   (Pulse)     │   (Pulse)     │              │
│        │               │               │              │
│        ├───────────────┼───────────────┤              │
│        │               │               │              │
│        │   YELLOW      │     BLUE      │              │
│        │   (Pulse)     │   (Pulse)     │              │
│        │               │               │              │
│        └───────────────┴───────────────┘              │
│                                                        │
│  Pattern Progress: ●●●○○○○○                           │
│  Speed: Normal [Slow] [Normal] [Fast] [Expert]        │
│                                                        │
│  [Start New Game] [Sound: ON]                         │
└─────────────────────────────────────────────────────────┘
```

### Whack-a-Mole - Game Grid
```
┌─────────────────────────────────────────────────────────┐
│  Whack-a-Mole       Score: 450    Time: 25s           │
│                     Combo: x4     Level: 3            │
├─────────────────────────────────────────────────────────┤
│                                                        │
│   ┌────┐  ┌────┐  ┌────┐  ┌────┐                    │
│   │ 🕳️ │  │ 🦔 │  │ 🕳️ │  │ 🕳️ │  (Mole appears)  │
│   └────┘  └────┘  └────┘  └────┘                    │
│                                                        │
│   ┌────┐  ┌────┐  ┌────┐  ┌────┐                    │
│   │ 💎 │  │ 🕳️ │  │ 🦔 │  │ 🕳️ │  (Bonus item)    │
│   └────┘  └────┘  └────┘  └────┘                    │
│                                                        │
│   ┌────┐  ┌────┐  ┌────┐  ┌────┐                    │
│   │ 🕳️ │  │ 💣 │  │ 🕳️ │  │ 🦔 │  (Avoid bomb)    │
│   └────┘  └────┘  └────┘  └────┘                    │
│                                                        │
│  Power-ups: [2x Score] [Freeze Time] [Multi-Hit]     │
│  Accuracy: 85%    Streak: 12    Misses: 3            │
├─────────────────────────────────────────────────────────┤
│  [Start Game] [Difficulty ▼] [Leaderboard]            │
└─────────────────────────────────────────────────────────┘
```

## Tournament Search & Filters

### Advanced Filter Panel
```
┌─────────────────────────────────────────────────────────┐
│  Filter Tournaments                                    │
├─────────────────────────────────────────────────────────┤
│  Game: [All Games ▼]                                  │
│  Format: ☐ Single Elim ☐ Double Elim ☐ Swiss ☐ RR   │
│  Status: ☐ Open ☐ In Progress ☐ Completed            │
│  Entry Fee: [Free] [$1-10] [$10-50] [$50+]          │
│  Players: [Any] [8-16] [16-32] [32+]                 │
│  Start Date: [From ___] [To ___]                     │
│  ☐ Friends Only  ☐ Has Prize Pool                    │
│  [Apply Filters] [Reset]                              │
└─────────────────────────────────────────────────────────┘
```

## Mobile Responsive Designs

### Mobile Tournament View (375px)
```
┌─────────────────────┐
│ Tournaments         │
│ [All] [Active] [+]  │
├─────────────────────┤
│ Spring Championship │
│ CPS Test • Mar 15   │
│ 24/32 • $100 Prize  │
│ [Register]          │
├─────────────────────┤
│ Weekly Tournament   │
│ Snake • Mar 20      │
│ 8/16 • Free Entry   │
│ [Register]          │
└─────────────────────┘
```

### Mobile Spectator Mode
```
┌─────────────────────┐
│ 🔴 LIVE Match       │
├─────────────────────┤
│ P1: 87  vs  P2: 92  │
│ Time: 00:45         │
│ 👁 234 viewers      │
├─────────────────────┤
│ [Game View]         │
│                     │
│                     │
├─────────────────────┤
│ [Chat] [Stats] [×]  │
└─────────────────────┘
```

## Accessibility Enhancements

### Tournament Accessibility
- Screen reader announcements for bracket updates
- Keyboard navigation through tournament brackets
- High contrast mode for tournament visualization
- Audio cues for match start/end notifications

### Game Accessibility Features
- **Solitaire**: Keyboard shortcuts for card movement
- **Simon Says**: Visual-only mode (no audio required)
- **Whack-a-Mole**: Adjustable speed settings

## Performance Optimizations

### Real-time Features
- WebSocket connection pooling for spectators
- Optimistic UI updates for tournament actions
- Lazy loading for tournament history
- Virtual scrolling for large brackets

### Bundle Optimization
- Code splitting per game
- Dynamic imports for tournament features
- Preload critical tournament assets
- Service worker caching for offline tournaments

## Analytics Integration

### Tournament Metrics
- Tournament participation rate
- Average match duration
- Spectator engagement time
- Drop-off points in brackets

### New Game Metrics
- Game completion rates
- Average session length
- Difficulty preference distribution
- Power-up usage patterns

## Recommendations

### Frontend Framework
- **Next.js 14**: App Router for SEO
- **React 18**: For component architecture
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **React DnD**: For Solitaire drag-and-drop

### Testing Approach
- Component testing with React Testing Library
- Visual regression with Chromatic
- Accessibility testing with axe-core
- Performance testing with Lighthouse
- Real-time testing with WebSocket mocks

### Monitoring
- Sentry for error tracking
- Vercel Analytics for performance
- Plausible for privacy-focused analytics
- Custom game metrics dashboard
- Tournament participation tracking