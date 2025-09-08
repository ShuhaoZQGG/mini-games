# Mini Games Platform - UI/UX Design Specifications

## Design System

### Core Principles
- **Guest-First**: Full functionality without registration
- **Mobile-First**: Touch-optimized responsive design
- **Performance**: < 100KB initial bundle, < 2s load time
- **Accessibility**: WCAG 2.1 AA compliant
- **Engagement**: Instant gameplay, minimal friction

### Design Tokens

#### Colors
```css
/* Light Theme */
--primary: #3B82F6      /* Blue - CTAs, links */
--secondary: #10B981    /* Green - success, scores */
--accent: #F59E0B       /* Amber - achievements */
--danger: #EF4444       /* Red - errors, losses */
--surface: #FFFFFF      /* Game backgrounds */
--background: #F9FAFB   /* Page background */
--text: #111827         /* Primary text */
--text-muted: #6B7280   /* Secondary text */

/* Dark Theme */
--primary-dark: #60A5FA
--secondary-dark: #34D399
--accent-dark: #FCD34D
--danger-dark: #F87171
--surface-dark: #1F2937
--background-dark: #111827
--text-dark: #F9FAFB
--text-muted-dark: #9CA3AF
```

#### Typography
```css
--font-display: 'Inter', system-ui    /* Headings */
--font-body: 'Inter', system-ui       /* Body text */
--font-mono: 'JetBrains Mono'         /* Scores, timers */

/* Scale */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
--text-4xl: 2.25rem    /* 36px */
```

#### Spacing
```css
--space-1: 0.25rem     /* 4px */
--space-2: 0.5rem      /* 8px */
--space-3: 0.75rem     /* 12px */
--space-4: 1rem        /* 16px */
--space-6: 1.5rem      /* 24px */
--space-8: 2rem        /* 32px */
--space-12: 3rem       /* 48px */
--space-16: 4rem       /* 64px */
```

#### Breakpoints
```css
--mobile: 640px
--tablet: 768px
--desktop: 1024px
--wide: 1280px
```

## Layout Architecture

### Navigation Structure
```
Header (Sticky)
├── Logo/Home
├── Game Categories Dropdown
├── Search (Desktop)
├── Theme Toggle
└── Auth/Profile Button

Mobile Navigation (Bottom)
├── Home
├── Games
├── Leaderboards
├── Tournaments
└── Profile
```

### Page Templates

#### Home Page
```
Hero Section
├── Featured Game Carousel
├── Quick Play CTAs
└── Daily Challenge Card

Game Categories Grid
├── Click Speed (5 games)
├── Puzzle (6 games)
├── Strategy (4 games)
├── Card Games (3 games)
├── Typing (2 games)
└── Casual (4+ games)

Social Proof
├── Active Players Counter
├── Recent High Scores
└── Tournament Winners
```

#### Game Page
```
Game Header
├── Title & Category
├── Difficulty Selector
├── Instructions Toggle
└── Share Button

Game Canvas (Responsive)
├── Pre-game Overlay
├── Game Area
├── Controls (Mobile)
└── Post-game Results

Game Stats Sidebar
├── Personal Best
├── Session Stats
├── Leaderboard Preview
└── Challenge Friends CTA
```

## Component Library

### Core Components

#### GameCard
```tsx
interface GameCardProps {
  game: {
    id: string
    title: string
    category: string
    thumbnail: string
    playCount: number
    difficulty: 'easy' | 'medium' | 'hard'
    isNew?: boolean
    isTrending?: boolean
  }
  variant: 'compact' | 'featured'
}
```
- Hover: Scale 1.05, shadow elevation
- Click: Scale 0.98, ripple effect
- Loading: Skeleton shimmer

#### LeaderboardRow
```tsx
interface LeaderboardRowProps {
  rank: number
  player: {
    id: string
    name: string
    avatar?: string
    isOnline?: boolean
  }
  score: number
  game: string
  timestamp: Date
  isCurrentUser?: boolean
}
```
- Highlight current user row
- Animate rank changes
- Show live indicators

#### TournamentCard
```tsx
interface TournamentCardProps {
  tournament: {
    id: string
    name: string
    game: string
    startTime: Date
    endTime: Date
    entrants: number
    maxEntrants: number
    prize?: string
    status: 'upcoming' | 'live' | 'completed'
  }
}
```
- Live tournaments pulse animation
- Progress bar for registration
- Countdown timer

### Game-Specific UI

#### Click Speed Games
- Large touch targets (min 44x44px)
- Visual feedback on click (ripple)
- Real-time counter animations
- Progress bars for time/clicks

#### Puzzle Games
- Grid layouts with gap spacing
- Drag-and-drop with ghost preview
- Hint system overlay
- Completion celebration animation

#### Strategy Games
- Board visualization with clear cells
- Valid move highlighting
- AI thinking indicator
- Move history sidebar

#### Card Games
- Card flip animations (3D transform)
- Drag-and-drop with snap zones
- Hand organization (fan layout)
- Deck/discard pile visualization

## User Journeys

### Guest User Flow
```
Landing → Game Selection → Instant Play
                ↓
        Score Display → Share Prompt
                ↓
    Sign Up Upsell (Soft) → Continue as Guest
```

### New User Onboarding
```
Sign Up → Avatar Selection → Favorite Games
            ↓
    Tutorial Game → First Achievement
            ↓
    Friend Suggestions → Homepage
```

### Returning Player Flow
```
Login → Personalized Dashboard
    ↓
Daily Challenge → Streak Update
    ↓
Resume Last Game / Browse New
```

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Bottom navigation bar
- Full-width game canvas
- Collapsible game info
- Touch-optimized controls
- Swipe gestures for navigation

### Tablet (640-1024px)
- 2-column game grid
- Side navigation drawer
- Floating action buttons
- Split-screen multiplayer
- Landscape game optimization

### Desktop (> 1024px)
- Multi-column layouts
- Sidebar navigation
- Hover interactions
- Keyboard shortcuts
- Picture-in-picture spectator
- Multi-tab tournament view

## Accessibility Features

### Visual
- High contrast mode
- Font size controls (75%-150%)
- Reduced motion option
- Focus indicators (2px outline)
- Color blind friendly palettes

### Navigation
- Skip to content links
- Keyboard navigation (Tab, Arrow keys)
- Screen reader announcements
- ARIA labels and landmarks
- Semantic HTML structure

### Gaming
- Difficulty adjustments
- Pause/resume capability
- Alternative input methods
- Audio cues for visual elements
- Extended time limits option

## Animation & Micro-interactions

### Page Transitions
- Route changes: Fade (200ms)
- Modal open: Scale + fade (300ms)
- Drawer slide: TranslateX (250ms)
- Tab switch: Slide (200ms)

### Game Feedback
- Score increase: Number roll-up
- Achievement unlock: Confetti burst
- Level complete: Star animation
- Error: Shake (150ms)
- Success: Check mark draw

### Loading States
- Skeleton screens for content
- Spinner for actions (< 1s)
- Progress bar for long operations
- Shimmer effect for placeholders

## New Game UI Specifications

### Pac-Man
- Maze: High contrast walls, clear paths
- Characters: Distinct colors, smooth animation
- Score: Top corner with combo multiplier
- Lives: Visual hearts/pac-men icons
- Power-ups: Pulsing glow effect

### Space Invaders
- Grid: Clear enemy formation
- Player: Centered bottom position
- Projectiles: Tracer effects
- Barriers: Damage visualization
- Score: Retro LED font style

### Pattern Memory
- Sequence: Large colored buttons
- Playback: Smooth highlight animation
- Input: Touch feedback ripple
- Progress: Level/speed indicator
- Timer: Circular progress ring

### Color Switch
- Path: Vertical scrolling smooth
- Obstacles: Clear color coding
- Player: Bouncing ball physics
- Transitions: Color fade effects
- Score: Floating +1 animations

### Sliding Puzzle
- Grid: Clear tile boundaries
- Numbers: Large, readable font
- Empty space: Dashed outline
- Moves: Slide animation (200ms)
- Completion: Tiles merge animation

### Crossword Puzzle
- Grid: Black/white squares
- Clues: Collapsible sidebar
- Input: Virtual keyboard (mobile)
- Validation: Green/red highlights
- Progress: Percentage complete

## Performance Optimizations

### Image Loading
- Lazy load below fold
- WebP with fallbacks
- Responsive srcset
- Blur-up placeholders
- CDN delivery

### Code Splitting
- Route-based chunks
- Game component lazy load
- Vendor bundle separation
- Dynamic imports for features

### Caching Strategy
- Static assets: 1 year
- API responses: 5 minutes
- User data: Session storage
- Game state: Local storage

## Implementation Priority

### Phase 1: Core Gaming
1. Game canvas responsive layouts
2. Touch controls for mobile
3. Score/leaderboard displays
4. Guest gameplay flow

### Phase 2: Social Features
1. Authentication UI (Supabase Auth)
2. Profile pages
3. Friend system interface
4. Tournament brackets

### Phase 3: Polish
1. Animations and transitions
2. Achievement notifications
3. Share cards generation
4. PWA installation prompts

## Design Handoff Notes

### For Developers
- Use Tailwind CSS classes for consistency
- Implement shadcn/ui components
- Follow mobile-first development
- Test on real devices
- Monitor Core Web Vitals

### Component Props
- All games accept difficulty prop
- Leaderboards accept period filter
- Cards support loading/error states
- Forms include validation feedback

### State Management
- Game state in React hooks
- User data in Zustand store
- Real-time via Supabase subscriptions
- Offline queue for score syncing

### Testing Requirements
- Cross-browser compatibility
- Touch/mouse input parity
- Offline mode functionality
- Accessibility audit pass
- Performance budget adherence