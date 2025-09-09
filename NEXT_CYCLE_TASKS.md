# Next Cycle Tasks

## Immediate Priority - PR #35 Revision

### Critical Action Required
PR #35 has been reviewed and needs revision before merge. The games are well-implemented but not accessible through UI.

**Next Developer Must:**
1. Fix navigation integration for new games
2. Add Air Hockey, Go, and Reversi to game list component
3. Fix ESLint configuration warnings
4. Re-test user flow from homepage to games
5. Update PR and request re-review

### Navigation Fix Steps
```bash
# Checkout the PR branch
gh pr checkout 35

# Find where existing games are registered
grep -r "Chess\|Pool\|Checkers" src/

# Add new games to the same location:
# - Air Hockey
# - Go 
# - Reversi

# Fix ESLint config
# Remove deprecated options: useEslintrc, extensions

# Test the changes
npm run build
npm run dev
# Navigate to each new game through UI

# Commit and push
git add .
git commit -m "fix: Add new games to navigation and fix ESLint config"
git push
```

## After PR #35 Fixes

### Remaining Multiplayer Games (Phase 2)
1. **Backgammon**
   - Dice rolling mechanics
   - Doubling cube feature
   - Move validation

2. **Dots and Boxes**
   - Line drawing interface
   - Chain scoring system
   - Territory calculation

3. **Mahjong Solitaire**
   - Tile matching logic
   - Multiple layouts
   - Hint system

### Infrastructure Tasks
1. **Database Types**
   - Generate Supabase types properly
   - Remove temporary type assertions
   - Update TypeScript interfaces

2. **Testing**
   - Add unit tests for game logic
   - Integration tests for multiplayer
   - E2E tests for critical flows

3. **Production Deployment**
   - Configure Vercel project
   - Set up Supabase production
   - Deploy and monitor

## Technical Debt

### High Priority
- Fix navigation for all multiplayer games
- Generate proper Supabase database types
- Add loading states for multiplayer connections
- Fix ESLint configuration

### Medium Priority
- Add comprehensive test coverage
- Implement ELO rating system
- Create matchmaking lobby UI
- Add game thumbnails/icons

### Low Priority
- Implement spectator mode for all games
- Add replay system
- Create tournament brackets
- Build mobile app wrapper

## Platform Status
- **Games Total**: 37/40+ (92.5% complete)
  - Single-Player: 30 games (all functional)
  - Multiplayer: 7 games (4 accessible, 3 need navigation)
- **Build**: Compiles with warnings
- **Bundle Size**: 87.2KB (within target)
- **Critical Issue**: New games not in navigation

## Success Metrics for Next Cycle
- [ ] All 37 games accessible through UI
- [ ] ESLint warnings resolved
- [ ] Basic test coverage added
- [ ] PR #35 merged to main
- [ ] Ready for production deployment

## Notes
The multiplayer infrastructure (`useMultiplayerGame` hook) from Cycle 13 is excellent and provides a solid foundation for future games. The immediate priority is making the new games discoverable through the UI - this is a simple fix that will unlock significant value.

Once navigation is fixed, we'll have 37 functional games (92.5% of target) with both single-player and multiplayer options, making the platform highly competitive.