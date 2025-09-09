# Cycle 10: UI/UX Design Specifications - Multiplayer Expansion

## Executive Summary
Design specifications for expanding from 30 to 40+ games with real-time multiplayer, daily challenges, and social features. Focus on performance (< 100KB bundle), accessibility (WCAG 2.1 AA), and mobile-first responsive design.

## Design System

### Color Palette
- **Primary**: #3B82F6 (Blue)
- **Secondary**: #10B981 (Green)
- **Accent**: #F59E0B (Orange)
- **Error**: #EF4444 (Red)
- **Dark Background**: #0F172A
- **Light Background**: #FFFFFF
- **Surface Dark**: #1E293B
- **Surface Light**: #F8FAFC

### Typography
- **Headings**: Inter (900/700/600)
- **Body**: Inter (400)
- **Monospace**: JetBrains Mono (game stats/codes)

### Spacing
- Base unit: 4px
- Components: 8px, 16px, 24px, 32px
- Sections: 48px, 64px, 96px

## Core Layout Components

### Navigation Bar
```
┌─────────────────────────────────────────────────┐
│ 🎮 MiniGames  [Games▼] [Leaderboards] [Daily]   │
│                              [Avatar] [Theme] 🔔 │
└─────────────────────────────────────────────────┘
```
- Fixed position with backdrop blur
- Game categories dropdown with search
- User menu with auth/profile/settings
- Notification bell for challenges/invites

### Game Hub (Homepage)
```
┌─────────────────────────────────────────────────┐
│ Welcome back, Player!     [Continue Playing >]  │
├─────────────────────────────────────────────────┤
│ 🔥 Daily Challenge: Beat 50 in CPS Test         │
├─────────────────────────────────────────────────┤
│ Featured Games                                  │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│ │Chess│ │CPS │ │2048│ │Snake│ [View All >]     │
│ └────┘ └────┘ └────┘ └────┘                   │
├─────────────────────────────────────────────────┤
│ Multiplayer Lobby          [Create Room] [Join] │
│ • Chess - 234 players online                    │
│ • Pool - 156 players online                     │
│ • Battleship - 89 players online               │
└─────────────────────────────────────────────────┘
```

### Game Interface Template
```
┌─────────────────────────────────────────────────┐
│ [← Back] Game Title         Level 3 ⭐⭐⭐☆☆    │
├─────────────────────────────────────────────────┤
│                                                 │
│              [Game Canvas Area]                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ Score: 1250 | Time: 02:45 | Best: 2100        │
│ [Restart] [Pause] [Settings] [Share]           │
└─────────────────────────────────────────────────┘
```

## Feature-Specific Designs

### Level System UI
```
Level Progression Bar:
[█████████░░░░░░] Level 3 - 450/600 XP

Star Requirements:
⭐ Complete level
⭐⭐ Score > 1000
⭐⭐⭐ Time < 60s
⭐⭐⭐⭐ No mistakes
⭐⭐⭐⭐⭐ Perfect run
```

### Multiplayer Game Room
```
┌─────────────────────────────────────────────────┐
│ Chess - Room #4521          [Invite] [Settings] │
├─────────────────────────────────────────────────┤
│ ┌─────────┐  VS  ┌─────────┐                  │
│ │ Player1 │      │ Player2 │   [Spectators: 5]│
│ │ ELO:1435│      │ ELO:1502│                  │
│ └─────────┘      └─────────┘                  │
├─────────────────────────────────────────────────┤
│              [Chess Board]                      │
│                                                 │
│ White: 05:23  ●○  Black: 04:15                │
├─────────────────────────────────────────────────┤
│ 💬 Chat                    [Send]               │
└─────────────────────────────────────────────────┘
```

### Daily Challenge Card
```
┌─────────────────────────────────────────────────┐
│ 📅 Today's Challenge - Nov 9                   │
│ ┌───────────────────────────────────────────┐ │
│ │ Beat 100 WPM in Typing Test               │ │
│ │ Progress: ████░░░░░░ 67/100               │ │
│ │ Time Left: 14h 32m                        │ │
│ │ Reward: 500 XP + Badge                    │ │
│ └───────────────────────────────────────────┘ │
│ [Play Now] [View Leaderboard]                  │
└─────────────────────────────────────────────────┘
```

### Leaderboard Component
```
┌─────────────────────────────────────────────────┐
│ Leaderboards    [Global] [Friends] [Country]   │
│ Game: [All Games ▼]  Period: [Today ▼]        │
├─────────────────────────────────────────────────┤
│ 🥇 1. AlphaGamer      Score: 9,850  🇺🇸       │
│ 🥈 2. SpeedDemon      Score: 9,720  🇯🇵       │
│ 🥉 3. ProPlayer123    Score: 9,650  🇬🇧       │
│ ─────────────────────────────────────          │
│ 📍 47. You            Score: 4,320  🇺🇸       │
└─────────────────────────────────────────────────┘
```

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Bottom navigation bar
- Full-screen game canvas
- Swipe gestures for navigation
- Touch-optimized controls

### Tablet (640px - 1024px)
- 2-column grid for game selection
- Side navigation drawer
- Larger touch targets
- Landscape game optimization

### Desktop (> 1024px)
- 4-column grid for games
- Persistent sidebar
- Hover states and tooltips
- Keyboard shortcuts
- Multi-window support

## User Journeys

### New User Flow
1. **Landing** → Hero with "Play Now" CTA
2. **Game Selection** → Popular games grid
3. **Guest Play** → Immediate gameplay
4. **Score Screen** → "Sign up to save" prompt
5. **Registration** → Social/email signup
6. **Profile Setup** → Avatar, username
7. **Dashboard** → Personalized home

### Multiplayer Flow
1. **Game Selection** → Choose multiplayer game
2. **Lobby** → Quick match / Create room / Join code
3. **Matchmaking** → ELO-based pairing
4. **Game Room** → Pre-game chat/settings
5. **Gameplay** → Real-time sync with indicators
6. **Results** → Stats, rematch option
7. **Social** → Add friend, share replay

### Daily Challenge Flow
1. **Notification** → Push/banner for new challenge
2. **Challenge Card** → Requirements and rewards
3. **Gameplay** → Special challenge mode
4. **Progress** → Live tracking against goal
5. **Completion** → Celebration animation
6. **Rewards** → XP, badges, leaderboard position

## Interaction Patterns

### Loading States
- Skeleton screens for content
- Progress bars for game loading
- Shimmer effects for dynamic content
- Optimistic UI updates

### Error Handling
- Inline validation messages
- Toast notifications for actions
- Fallback UI for failed loads
- Retry mechanisms with countdown

### Animations
- Page transitions: 200ms fade
- Button hover: scale(1.05)
- Card hover: translateY(-4px)
- Success: confetti burst
- Level up: star explosion

## Accessibility

### WCAG 2.1 AA Compliance
- Color contrast ratio ≥ 4.5:1
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Reduced motion options

### Game Accessibility
- Colorblind modes
- Adjustable game speed
- Visual/audio cues toggle
- Pause functionality
- Skip animations option

## Performance Optimizations

### Initial Load
- Critical CSS inline
- Lazy load below-fold content
- Preload game assets on hover
- Service worker for offline play
- WebP images with fallbacks

### Runtime Performance
- RequestAnimationFrame for games
- Web Workers for AI opponents
- Virtual scrolling for leaderboards
- Debounced search inputs
- Memoized expensive calculations

## Supabase Auth Integration

### Sign-In Modal
```
┌─────────────────────────────────────────────────┐
│              Welcome Back!                      │
├─────────────────────────────────────────────────┤
│ [📧 Continue with Email      ]                 │
│ [🔵 Continue with Google     ]                 │
│ [🐙 Continue with GitHub     ]                 │
│ ─────────── or ───────────                     │
│ Email: [___________________]                   │
│ Password: [________________]                   │
│ [Sign In]  Forgot password?                    │
│                                                 │
│ New here? Sign up                              │
└─────────────────────────────────────────────────┘
```

### Profile Management
```
┌─────────────────────────────────────────────────┐
│ Profile Settings                    [Save]      │
├─────────────────────────────────────────────────┤
│ [Avatar]  Username: [ProGamer123_]             │
│           Email: user@example.com              │
│           Member since: Nov 2024               │
├─────────────────────────────────────────────────┤
│ Stats     Games Played: 1,234                  │
│           Total Score: 45,678                  │
│           Best Rank: #12 Global                │
├─────────────────────────────────────────────────┤
│ Privacy   [✓] Show on leaderboards             │
│           [✓] Accept challenges                │
│           [ ] Share activity                   │
└─────────────────────────────────────────────────┘
```

## Component Library

### Buttons
- Primary: Blue background, white text
- Secondary: Border only, blue text
- Danger: Red background for destructive
- Ghost: Transparent with hover state
- Icon: Square aspect, minimal padding

### Cards
- Game card: Image, title, play count, rating
- Stats card: Icon, metric, trend indicator
- Player card: Avatar, name, status, actions
- Achievement: Icon, title, progress, unlock

### Forms
- Input: Border focus, error states
- Select: Custom dropdown with search
- Toggle: iOS-style switch
- Slider: Range with value tooltip
- Checkbox/Radio: Custom styled

### Modals
- Center overlay with backdrop
- Slide-in for mobile
- Close on escape/outside click
- Focus trap for accessibility

## Platform-Specific Features

### PWA Manifest
- App icon: 512x512px
- Splash screens for iOS/Android
- Orientation: both
- Display: standalone
- Theme color: #3B82F6

### Mobile Optimizations
- Viewport meta tag
- Touch gestures (swipe, pinch)
- Safe area insets (notch)
- Virtual keyboard handling
- Orientation lock for games

### Desktop Features
- Keyboard shortcuts (R: restart, P: pause)
- Right-click context menus
- Drag and drop for card games
- Multi-tab synchronization
- Download for offline play

## Technical Constraints

### Performance Targets
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Cumulative Layout Shift < 0.1
- Bundle size < 100KB initial
- 60 FPS game rendering

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers latest 2 versions

### Framework Integration
- Next.js App Router patterns
- shadcn/ui component usage
- Tailwind utility classes
- Framer Motion animations
- Supabase client components

## Future Considerations

### Phase 2 Features
- Tournament brackets UI
- Replay system interface
- Achievement showcase
- Custom room settings
- Voice chat indicators

### Monetization UI
- Premium badge display
- Ad placement zones
- In-game currency display
- Shop/store interface
- Subscription management

### Social Features
- Friend activity feed
- Guild/clan interfaces
- Direct messaging
- Game invitations
- Social media sharing

## Multiplayer Game Designs

### Chess Interface
```
┌─────────────────────────────────────────────────┐
│ ♔ Chess - Ranked Match         ELO: 1435 ±15   │
├─────────────────────────────────────────────────┤
│ Opponent: GrandMaster99 (1502)    ⏱ 05:23      │
├─────────────────────────────────────────────────┤
│   a  b  c  d  e  f  g  h                       │
│ 8 [♜][♞][♝][♛][♚][♝][♞][♜] 8   Move History   │
│ 7 [♟][♟][♟][♟][♟][♟][♟][♟] 7   1. e4 e5     │
│ 6 [ ][ ][ ][ ][ ][ ][ ][ ] 6   2. Nf3 Nc6    │
│ 5 [ ][ ][ ][ ][ ][ ][ ][ ] 5   3. Bb5 a6     │
│ 4 [ ][ ][ ][ ][♙][ ][ ][ ] 4   ...           │
│ 3 [ ][ ][ ][ ][ ][ ][ ][ ] 3                  │
│ 2 [♙][♙][♙][♙][ ][♙][♙][♙] 2   [Analysis]     │
│ 1 [♖][♘][♗][♕][♔][♗][♘][♖] 1   [Takeback]     │
│   a  b  c  d  e  f  g  h       [Draw] [Resign]│
├─────────────────────────────────────────────────┤
│ You: WhiteKnight21              ⏱ 04:45        │
└─────────────────────────────────────────────────┘
```

### Pool/8-Ball Interface
```
┌─────────────────────────────────────────────────┐
│ 🎱 8-Ball Pool                  Best of 3      │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ │
│ │                                           │ │
│ │         [Pool Table View]                 │ │
│ │    ○ ○ ● ● ○ ● ○                        │ │
│ │         ⬤ (cue ball)                     │ │
│ │                                           │ │
│ └───────────────────────────────────────────┘ │
│ Power: [████████░░] 80%   Spin: [↖️]          │
│ Angle: ← → (adjust)                            │
├─────────────────────────────────────────────────┤
│ Solids: ● ● ● ○ ○ ○ ○  |  Stripes: ▬ ▬ ▬ ▬   │
│ [Guidelines ON]  [3D View]  [Zoom]             │
└─────────────────────────────────────────────────┘
```

### Battleship Room Setup
```
┌─────────────────────────────────────────────────┐
│ ⚓ Battleship - Ship Placement                  │
├─────────────────────────────────────────────────┤
│ Your Fleet         │  Enemy Waters              │
│ ┌─────────────┐   │  ┌─────────────┐          │
│ │A B C D E F G│   │  │A B C D E F G│          │
│ │1 ▬ ▬ ▬ ▬ ▬ │   │  │1 ? ? ? ? ? ? │          │
│ │2 · · · · · │   │  │2 ? ? ? ? ? ? │          │
│ │3 ▬ ▬ ▬ · · │   │  │3 ? ? ? ? ? ? │          │
│ │4 · · · · · │   │  │4 ? ? ? ? ? ? │          │
│ │5 ▬ ▬ · · · │   │  │5 ? ? ? ? ? ? │          │
│ └─────────────┘   │  └─────────────┘          │
│                                                 │
│ Ships to Place:                                │
│ [Carrier (5)] [Battleship (4)] [Cruiser (3)]  │
│ [Submarine (3)] [Destroyer (2)]               │
│                                                 │
│ [Random] [Clear] [Ready]                       │
└─────────────────────────────────────────────────┘
```

### Air Hockey Real-time
```
┌─────────────────────────────────────────────────┐
│ 🏒 Air Hockey         First to 7               │
├─────────────────────────────────────────────────┤
│ Opponent: SpeedyPuck                Score: 3   │
│ ┌───────────────────────────────────────────┐ │
│ │              (Goal Zone)                  │ │
│ │     ○ <- opponent paddle                  │ │
│ │                                           │ │
│ │           ⚪ <- puck                      │ │
│ │                                           │ │
│ │     ○ <- your paddle                      │ │
│ │              (Goal Zone)                  │ │
│ └───────────────────────────────────────────┘ │
│ You: IceBreaker99                   Score: 5   │
│ Power-ups: [⚡ Speed] [🛡️ Shield] [🎯 Magnet]  │
└─────────────────────────────────────────────────┘
```

### Checkers Interface
```
┌─────────────────────────────────────────────────┐
│ 🎯 Checkers - International Rules              │
├─────────────────────────────────────────────────┤
│   1  2  3  4  5  6  7  8                       │
│ A [●][ ][●][ ][●][ ][●][ ]  Captures          │
│ B [ ][●][ ][●][ ][●][ ][●]  You: 3            │
│ C [●][ ][●][ ][●][ ][●][ ]  Opp: 1            │
│ D [ ][ ][ ][ ][ ][ ][ ][ ]                     │
│ E [ ][ ][ ][ ][ ][ ][ ][ ]  Turn: Yours       │
│ F [ ][○][ ][○][ ][○][ ][○]  Time: 02:15       │
│ G [○][ ][○][ ][○][ ][○][ ]                     │
│ H [ ][○][ ][○][ ][○][ ][○]  [Undo] [Hint]     │
└─────────────────────────────────────────────────┘
Legend: ● Your pieces  ○ Opponent  ♛♕ Kings
```

### Daily Challenge System
```
┌─────────────────────────────────────────────────┐
│ 🎯 Daily Challenges Hub                        │
├─────────────────────────────────────────────────┤
│ Current Streak: 🔥 7 days                      │
│                                                 │
│ ┌─────────────────┐ ┌─────────────────┐       │
│ │ Challenge #1    │ │ Challenge #2    │       │
│ │ Speed Chess     │ │ CPS Marathon    │       │
│ │ Win in < 3 min  │ │ 100 clicks/10s  │       │
│ │ ✅ Complete     │ │ ⏳ In Progress  │       │
│ │ Rank: #234      │ │ 67/100         │       │
│ └─────────────────┘ └─────────────────┘       │
│                                                 │
│ ┌─────────────────┐ ┌─────────────────┐       │
│ │ Challenge #3    │ │ Bonus Challenge │       │
│ │ Perfect Tetris  │ │ Unlock All 3   │       │
│ │ Clear 50 lines  │ │ 1000 XP Bonus  │       │
│ │ 🔒 Locked       │ │ 2/3 Complete   │       │
│ └─────────────────┘ └─────────────────┘       │
│                                                 │
│ Time Remaining: 16:42:33                       │
└─────────────────────────────────────────────────┘
```

### Matchmaking Lobby
```
┌─────────────────────────────────────────────────┐
│ 🎮 Quick Match - Finding Opponent              │
├─────────────────────────────────────────────────┤
│                                                 │
│           ⚡ Searching for players...           │
│                                                 │
│      [█████████░░░░░░░░░] Estimated: 15s      │
│                                                 │
│ Filters:                                       │
│ • Skill Level: Similar (±200 ELO)             │
│ • Region: Auto                                 │
│ • Game Mode: Ranked                           │
│                                                 │
│ Players Online: 1,234                          │
│ In Queue: 23                                   │
│                                                 │
│ [Cancel]                                       │
└─────────────────────────────────────────────────┘
```

### Friend System
```
┌─────────────────────────────────────────────────┐
│ 👥 Friends & Social                            │
├─────────────────────────────────────────────────┤
│ Online (5)                                     │
│ ● AlphaGamer    Playing Chess    [Join] [Chat] │
│ ● ProPlayer99   In Lobby         [Invite]      │
│ ● SpeedDemon    Playing CPS Test [Spectate]    │
│                                                 │
│ Offline (12)                                   │
│ ○ GameMaster    Last seen: 2h ago             │
│ ○ NinjaPlayer   Last seen: 1d ago             │
│                                                 │
│ Pending Invites (3)                           │
│ 📨 ChessKing99 wants to be friends [✓] [✗]    │
│                                                 │
│ [Add Friend] [Find Players] [Import Contacts]  │
└─────────────────────────────────────────────────┘
```

### Real-time Spectator View
```
┌─────────────────────────────────────────────────┐
│ 👁️ Spectating: AlphaGamer vs ProPlayer99       │
├─────────────────────────────────────────────────┤
│ [Live Game View with 5s delay]                 │
│                                                 │
│ Spectators (23): You, GameFan22, ChessLover... │
│                                                 │
│ 💬 Spectator Chat                              │
│ GameFan22: Great move!                        │
│ ChessLover: This is intense                   │
│ [Type message...]                [Send]        │
│                                                 │
│ [Exit] [Follow Player] [Fullscreen]           │
└─────────────────────────────────────────────────┘
```

## Implementation Notes

### Frontend Technologies
- **Framework**: Next.js 14 with App Router
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: Framer Motion for smooth transitions
- **State**: Zustand for client state, SWR for server state
- **Real-time**: Supabase Realtime channels

### Performance Requirements
- Initial bundle < 100KB
- Game code splitting with dynamic imports
- Service Worker for offline play
- Image optimization with next/image
- Font subsetting for critical text

### Accessibility Checklist
- ✅ Keyboard navigation for all interactions
- ✅ ARIA labels and live regions
- ✅ Focus management in modals
- ✅ Color contrast 4.5:1 minimum
- ✅ Reduced motion preferences
- ✅ Screen reader testing

### Testing Strategy
- Component testing with React Testing Library
- E2E testing with Playwright
- Visual regression with Percy
- Performance testing with Lighthouse CI
- Real device testing on BrowserStack