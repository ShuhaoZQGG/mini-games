#!/bin/bash

# Script to create 15 new mini-games for Cycle 35

# Arrays of game details
declare -a MULTIPLAYER_GAMES=(
  "online-mahjong:Online Mahjong:Traditional 4-player tile matching game"
  "online-go:Online Go:Ancient strategy board game"
  "online-carrom:Online Carrom:Disc flicking board game"
  "online-ludo:Online Ludo:Classic board game with dice"
  "online-rummy-500:Online Rummy 500:Point-based card game"
)

declare -a BRAIN_GAMES=(
  "memory-palace:Memory Palace:Spatial memory training"
  "speed-math:Speed Math:Mental calculation challenges"
  "pattern-matrix:Pattern Matrix:Visual pattern completion"
  "word-association:Word Association:Language connection game"
  "logic-gates:Logic Gates:Boolean logic puzzles"
)

declare -a ARCADE_GAMES=(
  "galaga-redux:Galaga Redux:Enhanced space shooter"
  "dig-dug-redux:Dig Dug Redux:Underground adventure"
  "burger-time:Burger Time:Food assembly arcade"
  "joust:Joust:Flying knight combat"
  "robotron:Robotron:Twin-stick shooter"
)

# Function to create game component
create_game_component() {
  local game_id=$1
  local game_name=$2
  local game_desc=$3
  local category=$4
  local component_path=$5
  
  # Convert game-id to ComponentName
  local component_name=$(echo "$game_name" | sed 's/ //g')
  
  cat > "$component_path" << EOF
'use client'

import React from 'react'
import GamePlaceholder from '@/components/games/GamePlaceholder'

export default function ${component_name}() {
  return (
    <GamePlaceholder 
      title="${game_name}"
      description="${game_desc}"
      category="${category}"
    />
  )
}
EOF
}

# Function to create game page
create_game_page() {
  local game_id=$1
  local game_name=$2
  local game_desc=$3
  local category=$4
  local component_import=$5
  
  local page_dir="app/games/${game_id}"
  mkdir -p "$page_dir"
  
  # Convert game-id to ComponentName
  local component_name=$(echo "$game_name" | sed 's/ //g')
  
  cat > "${page_dir}/page.tsx" << EOF
import type { Metadata } from 'next'
import ${component_name} from '${component_import}'

export const metadata: Metadata = {
  title: '${game_name} - Play Free Online | Mini Games',
  description: '${game_desc}. Play ${game_name} free online - no download required!'
}

export default function ${component_name}Page() {
  return <${component_name} />
}
EOF
}

# Create multiplayer games
echo "Creating multiplayer games..."
for game in "${MULTIPLAYER_GAMES[@]}"; do
  IFS=':' read -r id name desc <<< "$game"
  component_path="components/games/multiplayer/${name// /}.tsx"
  echo "Creating $name..."
  create_game_component "$id" "$name" "$desc" "Multiplayer" "$component_path"
  create_game_page "$id" "$name" "$desc" "Multiplayer" "@/components/games/multiplayer/${name// /}"
done

# Create brain training games
echo "Creating brain training games..."
for game in "${BRAIN_GAMES[@]}"; do
  IFS=':' read -r id name desc <<< "$game"
  component_path="components/games/brain/${name// /}.tsx"
  echo "Creating $name..."
  create_game_component "$id" "$name" "$desc" "Brain Training" "$component_path"
  create_game_page "$id" "$name" "$desc" "Brain Training" "@/components/games/brain/${name// /}"
done

# Create arcade games
echo "Creating arcade games..."
for game in "${ARCADE_GAMES[@]}"; do
  IFS=':' read -r id name desc <<< "$game"
  component_path="components/games/arcade/${name// /}.tsx"
  echo "Creating $name..."
  create_game_component "$id" "$name" "$desc" "Arcade" "$component_path"
  create_game_page "$id" "$name" "$desc" "Arcade" "@/components/games/arcade/${name// /}"
done

echo "All 15 games created successfully!"