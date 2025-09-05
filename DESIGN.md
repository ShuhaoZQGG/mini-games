# UI/UX Design Specifications - Mini Games Platform

## Visual Identity

### Brand Principles
- **Playful**: Vibrant, engaging, fun without being childish
- **Accessible**: Clear contrast, readable fonts, intuitive navigation
- **Fast**: Instant feedback, smooth animations, quick load times
- **Responsive**: Seamless experience across all devices

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

## Recommendations

### Frontend Framework
- **Next.js 14**: App Router for SEO
- **React 18**: For component architecture
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations

### Testing Approach
- Component testing with React Testing Library
- Visual regression with Chromatic
- Accessibility testing with axe-core
- Performance testing with Lighthouse

### Monitoring
- Sentry for error tracking
- Vercel Analytics for performance
- Plausible for privacy-focused analytics
- Custom game metrics dashboard