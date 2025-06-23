# 2D Miner - Game Design Document

## Game Overview
**Title:** 2D Miner (or Deep Dig Mining Co.)
**Genre:** Resource Management / Mining Simulation
**Platform:** Web (Mobile-first)
**Target Audience:** Casual players who enjoy incremental/management games

## Core Gameplay Loop
1. Start at surface with basic equipment
2. Purchase supplies and equipment upgrades
3. Descend to chosen depth via elevator
4. Mine for valuables while managing fuel and health
5. Return to surface before resources deplete
6. Sell valuables at assayer
7. Purchase upgrades to go deeper and carry more
8. Repeat with increasing efficiency

## Game Mechanics

### Resources
- **Health:** Depletes from hazards, restored at medical station
- **Fuel:** Consumed with each block mined, refilled at store
- **Cash:** Earned by selling valuables, spent on upgrades
- **Inventory:** Limited carrying capacity for valuables

### Valuables (Base Value / Rarity)
- Coal: $5 / Common
- Iron: $10 / Common  
- Silver: $30 / Uncommon
- Gold: $50 / Uncommon
- Platinum: $100 / Rare
- Ruby: $200 / Very Rare
- Emerald: $180 / Very Rare
- Diamond: $300 / Ultra Rare
- Sapphire: $150 / Very Rare

### Hazards
1. **Water Spring**
   - Floods connected tunnels
   - 20 health damage
   - Lose 30% of carried valuables
   - Forces upward movement

2. **Cave Collapse**  
   - Triggered by distance from elevator
   - 15 health damage
   - Lose 20% of carried valuables
   - Fills 3-block radius with dirt

3. **Gas Pocket** (Future)
   - Requires gas mask upgrade
   - Continuous health drain in area

### Progression Systems
1. **Equipment Upgrades**
   - Fuel Tank: 100 → 150 → 200 → 300...
   - Carrying Capacity: 10 → 15 → 20 → 30...
   - Protective Gear: Reduces hazard damage
   - Mining Speed: Faster block breaking

2. **Depth Warrants**
   - Surface (0m) - Starting
   - Shallow (50m) - $500
   - Medium (100m) - $1500  
   - Deep (200m) - $5000
   - Core (500m) - $20000

## Visual Style
- **Art Style:** Pixel art (16x16 or 24x24 tiles)
- **Color Palette:** Earth tones with bright valuable accents
- **UI Style:** Clean, minimal, mobile-friendly

## Technical Architecture
- **Frontend:** Vanilla JS with Canvas API
- **State Management:** Class-based game state
- **Persistence:** Supabase for saves/leaderboards
- **Asset Loading:** Sprite sheets for performance

## Audio (Future)
- Ambient cave sounds
- Mining sound effects
- Valuable discovery chimes
- Hazard warnings

## Monetization (Future)
- Free to play
- Optional cosmetic miner skins
- Ad-supported energy refills
