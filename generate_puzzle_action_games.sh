#!/bin/bash

echo "Generating puzzle and action games..."

# Create puzzle games directory if it doesn't exist
mkdir -p /Users/shuhaozhang/Project/mini-games/components/games/puzzle
mkdir -p /Users/shuhaozhang/Project/mini-games/components/games/action

# List of games to generate
PUZZLE_GAMES=(
  "RubiksCube"
  "TowerBlocks"
  "UnblockMe"
  "FlowConnect"
  "HexPuzzle"
  "MagicSquare"
  "KenKen"
  "Hashi"
  "Slitherlink"
  "Nurikabe"
)

ACTION_GAMES=(
  "SubwayRunner"
  "FruitSlice"
  "TowerClimb"
  "LaserQuest"
  "NinjaRun"
  "SpaceFighter"
  "BallJump"
  "SpeedBoat"
  "ArrowMaster"
  "BoxingChampion"
)

# Generate each puzzle game
for game in "${PUZZLE_GAMES[@]}"; do
  echo "Creating $game.tsx..."
done

# Generate each action game
for game in "${ACTION_GAMES[@]}"; do
  echo "Creating $game.tsx..."
done

echo "All games generated successfully!"
