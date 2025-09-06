# Mini Games Platform - Cycle 18 UI/UX Design Specifications

## Design System

### Brand Identity
- **Primary Color**: #3B82F6 (Blue)
- **Secondary Color**: #10B981 (Green)
- **Accent Color**: #F59E0B (Amber)
- **Error Color**: #EF4444 (Red)
- **Dark Mode Primary**: #1F2937
- **Dark Mode Surface**: #111827

### Typography
- **Headings**: Inter, system-ui, -apple-system
- **Body**: Inter, system-ui, -apple-system
- **Monospace**: 'Fira Code', 'Courier New'
- **Scale**: 12px, 14px, 16px, 20px, 24px, 32px, 48px

## PR Management Interface (Priority)

### PR Dashboard
```
┌────────────────────────────────────────┐
│ Pull Request Management                │
├────────────────────────────────────────┤
│ ✅ PR #17: Production Infrastructure   │
│    → main | Ready to merge            │
│    Build: ✅ Passing                   │
│    [Squash & Merge] [View Changes]    │
├────────────────────────────────────────┤
│ ⚠️ PR #18: Development Pipeline       │
│    → cycle-1 | 2 conflicts            │
│    Build: ⏸️ Pending                   │
│    [Resolve Conflicts] [View Diff]    │
└────────────────────────────────────────┘
```

### Conflict Resolution UI
```
┌─────────────────────────────────────────┐
│ Resolving Conflicts: PR #18             │
├─────────────────────────────────────────┤
│ File: package.json                      │
│ <<<<<<< cycle-17 (Current)              │
│   "version": "1.1.0"                    │
│ =======                                  │
│   "version": "1.0.0"                    │
│ >>>>>>> cycle-1 (Base)                  │
│                                         │
│ [Accept Current] [Accept Base] [Edit]   │
└─────────────────────────────────────────┘
```

## User Journeys

### Guest User Flow
1. **Landing** → Game grid with instant play CTAs
2. **Game Selection** → Direct game launch without friction
3. **Gameplay** → Full features, local score tracking
4. **Game End** → Score display, retry, share, sign-up prompt
5. **Discovery** → Related games, popular games carousel

### Authenticated User Flow
1. **Landing** → Personalized dashboard with recent games
2. **Profile** → Stats, achievements, friends, settings
3. **Gameplay** → Score sync, leaderboard position live
4. **Social** → Challenge friends, join tournaments
5. **Progress** → Achievement unlocks, level progression

## New Games UI Specifications (10 Games)

### 1. Blackjack
```
┌─────────────────────────────────────────┐
│ Dealer: 17        [?][7♠]              │
├─────────────────────────────────────────┤
│                                         │
│ You: 20          [K♥][10♣]             │
│                                         │
│ Chips: $1000     Bet: $50              │
│ [Hit] [Stand] [Double] [Split]         │
└─────────────────────────────────────────┘
```
- Card animations with flip effects
- Chip betting interface with drag-drop
- Split/double down action buttons
- Running count display

### 2. Pattern Memory
```
┌─────────────────────────────────────────┐
│ Level: 5    Score: 450    Lives: ♥♥♥   │
├─────────────────────────────────────────┤
│   ┌─┬─┬─┬─┐                           │
│   ├─┼─┼─┼─┤  Pattern Preview          │
│   ├─┼─┼─┼─┤  (3 seconds)              │
│   ├─┼─┼─┼─┤                           │
│   └─┴─┴─┴─┘                           │
│                                         │
│ [Start Round] Time Bonus: x2           │
└─────────────────────────────────────────┘
```
- Grid of tiles with reveal animations
- Pattern preview with countdown
- Score multiplier for speed
- Difficulty progression indicator

### 3. Color Switch
```
┌─────────────────────────────────────────┐
│ Score: 24        Best: 89              │
├─────────────────────────────────────────┤
│           ◯ (rotating wheel)           │
│           |                            │
│          ⬤ (player ball)               │
│           |                            │
│           ◯ (rotating wheel)           │
│                                         │
│        [Tap to Jump]                   │
└─────────────────────────────────────────┘
```
- Vertical scrolling viewport
- Color wheel obstacles with rotation
- Particle effects on collision
- High score ghost line

### 4. Jigsaw Puzzle
```
┌─────────────────────────────────────────┐
│ Progress: 67%    Time: 5:23    🧩      │
├─────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐     │
│ │ Puzzle Area  │  │ Piece Tray   │     │
│ │              │  │ [🧩][🧩][🧩]  │     │
│ │   [Image]    │  │ [🧩][🧩][🧩]  │     │
│ │              │  │              │     │
│ └──────────────┘  └──────────────┘     │
│ [Hint] [Preview] [Edges Only] [Reset]  │
└─────────────────────────────────────────┘
```
- Piece tray with auto-organization
- Snap-to-grid with magnetism
- Progress percentage display
- Hint system with edge highlighting

### 5. Sliding Puzzle
```
┌─────────────────────────────────────────┐
│ Moves: 142    Best: 98    Timer: 2:15  │
├─────────────────────────────────────────┤
│         ┌──┬──┬──┬──┐                  │
│         │1 │2 │3 │4 │                  │
│         ├──┼──┼──┼──┤                  │
│         │5 │6 │7 │8 │                  │
│         ├──┼──┼──┼──┤                  │
│         │9 │10│11│  │                  │
│         ├──┼──┼──┼──┤                  │
│         │13│14│15│12│                  │
│         └──┴──┴──┴──┘                  │
│ [Shuffle] [Solution] [Reset]           │
└─────────────────────────────────────────┘
```
- Smooth tile sliding animations
- Move counter and timer
- Shuffle animation on start
- Solution preview toggle

### 6. Flappy Bird Clone
```
┌─────────────────────────────────────────┐
│ Score: 12        Best: 45              │
├─────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░🐦░░░░██░░░░░░░░██░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                         │
│         [Tap/Space to Flap]            │
└─────────────────────────────────────────┘
```
- Parallax background scrolling
- Pipe generation with varied gaps
- Score popup animations
- Medal achievements display

### 7. Crossword
```
┌─────────────────────────────────────────┐
│ Daily Crossword    Timer: 12:34        │
├─────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────────┐  │
│ │ Grid        │  │ Clues            │  │
│ │ ■□□□■      │  │ Across:          │  │
│ │ □□□□□      │  │ 1. Capital (5)   │  │
│ │ □■□■□      │  │ 3. Animal (3)    │  │
│ │             │  │ Down:            │  │
│ │             │  │ 2. Color (4)     │  │
│ └─────────────┘  └──────────────────┘  │
│ [Check] [Reveal Letter] [Clear] [Hint] │
└─────────────────────────────────────────┘
```
- Interactive grid with keyboard input
- Clue sidebar with active highlighting
- Word validation feedback
- Progress save/restore

### 8. Pac-Man Clone
```
┌─────────────────────────────────────────┐
│ Score: 1240   Lives: ●●○   🍒          │
├─────────────────────────────────────────┤
│ ╔════════════════════════════════════╗ │
│ ║·····················●··············║ │
│ ║·╔══╗·╔════╗·╔══╗·╔════╗·╔══╗·····║ │
│ ║·║  ║·║    ║·║  ║·║    ║·║  ║·····║ │
│ ║·╚══╝·╚════╝·╚══╝·╚════╝·╚══╝·····║ │
│ ║····ᗤ·······👻·····················║ │
│ ╚════════════════════════════════════╝ │
│         [Arrow Keys/Swipe]             │
└─────────────────────────────────────────┘
```
- Maze with neon glow effects
- Ghost AI state indicators
- Power-up timer visualization
- Lives and fruit bonus display

### 9. Space Invaders
```
┌─────────────────────────────────────────┐
│ Score: 890    Lives: ▲▲▲   Wave: 3     │
├─────────────────────────────────────────┤
│  👾 👾 👾 👾 👾 👾 👾 👾                 │
│  👾 👾 👾 👾 👾 👾 👾 👾                 │
│  👾 👾 👾 👾 👾 👾 👾 👾                 │
│                                         │
│  ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓                   │
│                                         │
│          ▲                             │
│ [←→ Move] [Space: Fire]                │
└─────────────────────────────────────────┘
```
- Retro pixel art style
- Wave formation movements
- Barrier degradation effects
- UFO bonus appearances

### 10. Video Poker
```
┌─────────────────────────────────────────┐
│ Credits: 500    Bet: 5    Win: 0       │
├─────────────────────────────────────────┤
│   [A♠] [K♠] [Q♠] [J♠] [10♠]           │
│   HOLD  HOLD  HOLD  HOLD  HOLD         │
│                                         │
│ Royal Flush: 800x  │  Flush: 6x        │
│ Straight: 4x       │  Pair: 1x         │
│                                         │
│ [Deal/Draw] [Bet Max] [Cash Out]       │
└─────────────────────────────────────────┘
```
- Card deal animations
- Hold/draw toggle buttons
- Payout table highlight
- Credit/bet management

## Core Components

### Navigation Header
```
┌─────────────────────────────────────────────────┐
│ 🎮 Mini Games  [Search...]  🌙  🔔  👤          │
├─────────────────────────────────────────────────┤
│ All Games | Popular | New | Categories | Tournaments│
└─────────────────────────────────────────────────┘
```

### Game Card Component
```
┌─────────────────┐
│     [Icon]      │
│   Game Title    │
│  ⭐ 4.8  👥 12K │
│ [Play Now] [♥]  │
└─────────────────┘
```

### Leaderboard Widget
```
┌──────────────────────┐
│ 🏆 Top Players       │
├──────────────────────┤
│ 1. Player1    9,999  │
│ 2. Player2    8,888  │
│ 3. You        7,777  │
│ ...                  │
│ [View All]           │
└──────────────────────┘
```

## Responsive Breakpoints

### Mobile (320-768px)
- Single column game grid
- Bottom navigation bar
- Full-screen game mode
- Touch-optimized controls (44px minimum)

### Tablet (768-1024px)
- 2-3 column game grid
- Side navigation drawer
- Split-view for game + leaderboard
- Hover states on capable devices

### Desktop (1024px+)
- 4-6 column game grid
- Persistent sidebar
- Multi-panel layouts
- Keyboard shortcuts enabled

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Focus Indicators**: 2px solid outline
- **Touch Targets**: 44x44px minimum
- **Alt Text**: All images and icons

### Screen Reader Support
- ARIA labels on interactive elements
- Live regions for score updates
- Semantic HTML structure
- Skip navigation links

### Reduced Motion
- Respect prefers-reduced-motion
- Alternative transitions
- Disable auto-playing animations
- Static loading indicators

## Performance Targets

### Core Web Vitals
- **LCP**: <2.5s (Largest Contentful Paint)
- **FID**: <100ms (First Input Delay)
- **CLS**: <0.1 (Cumulative Layout Shift)
- **TTI**: <3.0s (Time to Interactive)

## Dark Mode Adaptations

### Color Inversions
- Backgrounds: #111827 → #F9FAFB
- Text: #F9FAFB → #111827
- Shadows: Reduced opacity
- Borders: Subtle glow effects

### Game-Specific
- Preserve game colors
- Adjust UI chrome only
- Maintain contrast ratios
- Optional per-game toggle

## Animation Guidelines

### Micro-interactions
- Button hover: scale(1.05) 200ms ease
- Card flip: rotateY(180deg) 400ms cubic-bezier
- Score increment: countUp animation 500ms
- Achievement unlock: slideIn + bounce 600ms

### Game Transitions
- Scene transitions: 300ms fade
- Level progression: 500ms slide
- Game over: 400ms blur + scale
- Victory: confetti particle system

## Social Features UI

### Friend List
```
┌──────────────────────┐
│ Friends (12 online)  │
├──────────────────────┤
│ 🟢 Alice  [Challenge]│
│ 🟢 Bob    [Spectate] │
│ ⚫ Charlie [Invite]  │
└──────────────────────┘
```

### Tournament Bracket
```
┌─────────────────────────────────────────┐
│         Tournament: Summer Cup          │
├─────────────────────────────────────────┤
│  Round 1    Semi-Finals    Finals      │
│  Player1 ─┐                            │
│           ├─ Winner1 ─┐                │
│  Player2 ─┘            │                │
│                        ├─ Champion      │
│  Player3 ─┐            │                │
│           ├─ Winner2 ─┘                │
│  Player4 ─┘                            │
└─────────────────────────────────────────┘
```

### Live Chat
```
┌──────────────────────┐
│ Spectator Chat  👥8  │
├──────────────────────┤
│ User1: Nice move!    │
│ User2: GG            │
│ [Type message...]    │
└──────────────────────┘
```

## Component Library

### Buttons
- Primary: Blue background, white text
- Secondary: Border only, blue text
- Danger: Red background, white text
- Ghost: Transparent, hover reveal

### Forms
- Input: Border focus, label animation
- Select: Custom dropdown, search filter
- Checkbox: Custom design, smooth check
- Radio: Grouped with clear selection

### Modals
- Backdrop blur effect
- Slide-up animation mobile
- Fade-in animation desktop
- Trap focus, escape to close

### Notifications
- Toast: Auto-dismiss 4s
- Banner: Persistent, dismissible
- Badge: Number indicators
- Pulse: Attention animation

## Implementation Priority

### Phase 1: PR Management (Immediate)
1. PR dashboard UI
2. Conflict resolution interface
3. Build status indicators
4. Merge action buttons

### Phase 2: New Games UI (Days 3-8)
1. Quick wins (Blackjack, Pattern Memory, Color Switch)
2. Medium complexity (Jigsaw, Sliding Puzzle, Flappy Bird)
3. Advanced games (Crossword, Pac-Man, Space Invaders, Video Poker)

### Phase 3: Platform Enhancement
1. Improved leaderboards
2. Tournament UI updates
3. Social features refinement
4. Performance optimizations

## Design Tokens

```typescript
const tokens = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.1)'
  }
}
```

## Frontend Recommendations

### Tech Stack
- **Next.js 14**: App Router for SEO optimization
- **React 18**: Component architecture
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Supabase Auth UI**: Pre-built authentication components

### Testing Strategy
- Component testing with React Testing Library
- Visual regression with Chromatic
- Accessibility testing with axe-core
- Performance testing with Lighthouse

## Conclusion

This design system provides comprehensive UI/UX specifications for Cycle 18, focusing on:
1. **Immediate needs**: PR management interface for merging #17 and resolving #18 conflicts
2. **Game expansion**: UI designs for 10 new games to reach 25+ total
3. **Platform consistency**: Unified design system across all features
4. **Performance & accessibility**: Meeting web standards and user needs

The modular component approach enables rapid development while maintaining design coherence and optimal user experience across all devices.