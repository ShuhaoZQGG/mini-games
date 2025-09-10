# UI/UX Design Specifications - Cycle 17

## Design System

### Color Palette
```css
--primary: #3B82F6;
--secondary: #8B5CF6;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--neutral: #6B7280;
--dark-bg: #111827;
--light-bg: #F9FAFB;
```

### Typography
- **Headings**: Inter, system-ui
- **Body**: Inter, -apple-system
- **Monospace**: 'Fira Code', monospace
- **Sizes**: 12px, 14px, 16px, 20px, 24px, 32px, 48px

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

## User Journeys

### Guest User Flow
1. **Landing** → View CategoryGrid → Select category
2. **Category Page** → Browse games → Click game card
3. **Game Page** → Play immediately → View score
4. **Post-Game** → Share score → Try another game

### Authenticated User Flow
1. **Landing** → Sign in → View personalized recommendations
2. **Dashboard** → Check stats → View leaderboard position
3. **Game** → Play → Submit score to leaderboard
4. **Profile** → Track achievements → View play history

### Multiplayer Flow
1. **Game Selection** → Create/Join room → Wait for opponent
2. **Game Lobby** → Chat → Start game
3. **Gameplay** → Real-time sync → End game
4. **Results** → View stats → Rematch/Exit

## Page Layouts

### Homepage
```
┌─────────────────────────────────────┐
│ Header (Logo | Nav | Auth | Theme)  │
├─────────────────────────────────────┤
│ Hero Section                        │
│ - Featured Games Carousel           │
│ - Quick Play CTAs                   │
├─────────────────────────────────────┤
│ CategoryGrid (10 categories)        │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ Cat1 │ │ Cat2 │ │ Cat3 │         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ Popular Games Section               │
│ - GameCard grid (8 games)           │
├─────────────────────────────────────┤
│ Leaderboard Preview                 │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

### Category Page
```
┌─────────────────────────────────────┐
│ Header with Breadcrumbs             │
├─────────────────────────────────────┤
│ Category Hero                       │
│ - Icon, Name, Description           │
│ - Game count, Filters               │
├─────────────────────────────────────┤
│ GameSearch Bar                      │
├─────────────────────────────────────┤
│ Games Grid (Responsive)             │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │GameCard│ │GameCard│ │GameCard│   │
│ └────────┘ └────────┘ └────────┘   │
├─────────────────────────────────────┤
│ Pagination                          │
└─────────────────────────────────────┘
```

### Game Page
```
┌─────────────────────────────────────┐
│ Game Header                         │
│ - Title, Category Badge, Rating     │
├─────────────────────────────────────┤
│ ┌─────────────┬──────────────────┐  │
│ │             │ Game Info Panel   │  │
│ │   Game      │ - Description     │  │
│ │   Canvas    │ - Controls        │  │
│ │             │ - High Score      │  │
│ │             │ - Play Stats      │  │
│ └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│ Game Controls Bar                   │
│ [Play] [Pause] [Reset] [Settings]   │
├─────────────────────────────────────┤
│ Leaderboard Table                   │
└─────────────────────────────────────┘
```

## Component Specifications

### CategoryGrid
```tsx
interface CategoryGridProps {
  categories: Category[]
  featured?: boolean
  columns?: 2 | 3 | 4 | 5
}

// Visual: 
// - Card layout with icon, name, game count
// - Hover: Scale 1.05, shadow elevation
// - Click: Navigate to category page
// - Colors: Use category.color for accent
```

### GameCard
```tsx
interface GameCardProps {
  game: GameMetadata
  showRating?: boolean
  showPlayCount?: boolean
  size?: 'small' | 'medium' | 'large'
}

// Visual:
// - Thumbnail image with gradient overlay
// - Title, category badge, difficulty indicator
// - Play button on hover
// - Stats: rating stars, play count
```

### GameSearch
```tsx
interface GameSearchProps {
  placeholder?: string
  categories?: Category[]
  onSearch: (query: string, filters: Filters) => void
}

// Features:
// - Instant search with debounce
// - Filter dropdowns: category, difficulty, players
// - Sort options: popular, new, rating
// - Clear filters button
```

### LeaderboardWidget
```tsx
interface LeaderboardProps {
  gameSlug: string
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'
  limit?: number
}

// Visual:
// - Rank, avatar, username, score, date
// - Current user highlighted
// - Period selector tabs
// - Load more pagination
```

## Responsive Breakpoints
```scss
$mobile: 320px - 767px;
$tablet: 768px - 1023px;
$desktop: 1024px - 1439px;
$wide: 1440px+;

// Grid columns
// Mobile: 1-2 columns
// Tablet: 2-3 columns  
// Desktop: 3-4 columns
// Wide: 4-5 columns
```

## Game-Specific UI

### New Games (Cycle 17)

#### Wordle
```
┌─────────────────────────┐
│  W O R D L E           │
├─────────────────────────┤
│ ┌─┬─┬─┬─┬─┐ Attempt 1 │
│ └─┴─┴─┴─┴─┘           │
│ ┌─┬─┬─┬─┬─┐ Attempt 2 │
│ └─┴─┴─┴─┴─┘           │
├─────────────────────────┤
│ Virtual Keyboard        │
│ Q W E R T Y U I O P    │
│  A S D F G H J K L     │
│   Z X C V B N M        │
└─────────────────────────┘

Colors:
- Green: Correct position
- Yellow: Wrong position
- Gray: Not in word
```

#### Bubble Shooter
```
┌─────────────────────────┐
│ Score: 0  Level: 1      │
├─────────────────────────┤
│  ● ● ● ● ● ● ● ●       │
│   ● ● ● ● ● ● ●        │
│  ● ● ● ● ● ● ● ●       │
│                         │
│         ↑               │
│        [●]              │
│     Aim & Shoot         │
├─────────────────────────┤
│ Next: ● | Power-ups: 3  │
└─────────────────────────┘

Mechanics:
- Touch/mouse aim line
- Color preview
- Combo multiplier display
```

#### Pinball
```
┌─────────────────────────┐
│ PINBALL  Score: 0000    │
├─────────────────────────┤
│ ╔═══════════════════╗   │
│ ║  ● ● ●   ● ● ●   ║   │
│ ║    ╱ ╲   ╱ ╲     ║   │
│ ║   │   │ │   │    ║   │
│ ║    ╲ ╱   ╲ ╱     ║   │
│ ║      ●     ●      ║   │
│ ║    ╱─────────╲    ║   │
│ ╚═══════════════════╝   │
├─────────────────────────┤
│ [Space] Launch          │
│ [←][→] Flippers         │
└─────────────────────────┘

Visual Effects:
- Ball trail
- Bumper animations
- Score popups
```

#### Nonogram
```
┌─────────────────────────┐
│ NONOGRAM  15x15         │
├─────────────────────────┤
│     1 2 1 3 2           │
│   ┌─┬─┬─┬─┬─┐           │
│ 2 │ │ │█│█│ │           │
│ 3 │ │█│█│█│ │           │
│ 1 │ │ │█│ │ │           │
│   └─┴─┴─┴─┴─┘           │
├─────────────────────────┤
│ [Click] Fill            │
│ [Right-Click] Mark X    │
└─────────────────────────┘

Features:
- Hint highlights
- Error checking
- Progress save
```

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Focus Indicators**: Visible keyboard navigation
- **Screen Readers**: ARIA labels and live regions
- **Keyboard Navigation**: All interactive elements
- **Touch Targets**: Minimum 44x44px

### Game Accessibility
- **Difficulty Settings**: Easy/Medium/Hard modes
- **Pause Function**: All games pauseable
- **Color Blind Mode**: Alternative color schemes
- **Sound Toggle**: Mute options
- **Text Size**: Scalable UI elements

## Animation & Transitions

### Micro-interactions
```css
/* Card hover */
transition: transform 0.2s ease, box-shadow 0.2s ease;

/* Page transitions */
animation: fadeIn 0.3s ease-out;

/* Score updates */
animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Loading states */
animation: pulse 1.5s ease-in-out infinite;
```

### Game Animations
- **Win State**: Confetti particle effect
- **Score Update**: Number roll animation
- **Level Up**: Screen flash + badge animation
- **Game Over**: Fade to results screen

## Dark Mode Specifications

### Color Adjustments
```css
[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border: #334155;
}
```

### Component Variants
- Inverted shadows for depth
- Reduced contrast for eye comfort
- Highlighted interactive elements
- Preserved brand colors

## Performance Targets

### Loading
- **FCP**: < 1.5s
- **TTI**: < 3.5s
- **CLS**: < 0.1
- **FID**: < 100ms

### Runtime
- **Game FPS**: 60fps consistent
- **Animations**: GPU accelerated
- **Bundle Size**: < 100KB initial
- **Image Loading**: Lazy + WebP format

## Mobile Optimizations

### Touch Controls
- **Swipe Gestures**: Navigation and gameplay
- **Pinch Zoom**: Disabled during games
- **Touch Feedback**: Haptic on supported devices
- **Orientation Lock**: Portrait for most games

### PWA Features
```json
{
  "name": "Mini Games Platform",
  "short_name": "MiniGames",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff"
}
```

## Supabase Auth UI Integration

### Sign In Modal
```tsx
<Auth
  supabaseClient={supabase}
  appearance={{
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: '#3B82F6',
          brandAccent: '#2563EB'
        }
      }
    }
  }}
  providers={['google', 'github', 'discord']}
  redirectTo={window.location.origin}
/>
```

### User Menu
- Avatar with dropdown
- Profile, Stats, Settings, Sign Out
- Achievement badges display
- Friends online indicator

## Frontend Framework Recommendations

### Core Stack
- **Framework**: Next.js 14 (existing)
- **UI Library**: shadcn/ui components
- **State**: Zustand for game state
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Component Structure
```
components/
├── ui/              # shadcn/ui base components
├── game/            # Game-specific components
├── layout/          # Header, Footer, Navigation
├── features/        # CategoryGrid, GameCard, etc.
└── shared/          # Utilities and common components
```

## Implementation Priority

1. **Critical Path** (PR Fixes)
   - Fix homepage CategoryGrid integration
   - Update navigation with all games
   - Resolve test failures

2. **Core UI** (Category System)
   - CategoryGrid component
   - GameCard enhancements
   - Search and filter functionality

3. **New Games** (Cycle 17 Targets)
   - Wordle implementation
   - Bubble Shooter physics
   - Pinball mechanics
   - Nonogram logic

4. **Polish** (UX Enhancement)
   - Animations and transitions
   - Dark mode refinement
   - Mobile optimizations
   - Accessibility improvements