# Deep Dig Mining Co. - Project Overview

## Game Concept
Deep Dig Mining Co. is a 2D mining game where players dig underground to collect valuable ores while managing their energy resources. The game combines resource management, exploration, and economic strategy in a grid-based world.

## Core Gameplay Loop
1. **Start on Surface**: Player begins at the surface with access to four buildings
2. **Enter Mine**: Use the elevator to descend underground
3. **Mine Resources**: Dig through tiles to find valuable ores (costs energy per tile)
4. **Manage Energy**: Return to surface before running out of energy
5. **Sell Ores**: Visit the Assayer to convert collected ores to cash
6. **Purchase Upgrades**: Buy energy refills and equipment at the Store
7. **Go Deeper**: Unlock deeper mining levels and find rarer ores

## Technical Architecture

### Module Structure (ES6)
```
src/
├── core/
│   ├── Game.js         - Main game loop and initialization
│   ├── GameState.js    - Centralized state management
│   └── Constants.js    - All game constants and configuration
├── entities/
│   ├── Player.js       - Player movement, mining, physics
│   └── World.js        - Tile generation and world management
├── systems/
│   ├── Renderer.js     - Canvas rendering system
│   ├── InputManager.js - Keyboard and touch input handling
│   └── Camera.js       - Viewport management
└── ui/
    ├── StoreMenu.js    - Energy and upgrade purchases
    ├── AssayerMenu.js  - Ore selling interface
    └── EmergencyEnergyMenu.js - Low energy warning/purchase
```

### Key Systems

#### 1. Grid-Based World
- **Tile Size**: 32x32 pixels
- **World Storage**: Sparse Map for efficiency (only stores non-empty tiles)
- **Procedural Generation**: Ore probability increases with depth (quadratic scaling)

#### 2. Mining Mechanics
- **Auto-Mining**: Player mines tiles by moving into them
- **Energy Cost**: Each tile type has different energy requirements
- **Grid Alignment**: Player snaps to grid when mining downward
- **Single Column**: Downward mining restricted to one column at a time

#### 3. Physics System
- **Gravity**: 27,000 pixels/sec² acceleration when not on ground
- **Fall Damage**: Scaled by distance (20% at 20ft, 50% at 30ft, fatal at 40ft+)
- **Movement Restrictions**: No upward movement underground except in elevator

#### 4. Fog of War
- **Hidden Tiles**: All tiles appear as dirt until discovered
- **Discovery System**: 20% chance to reveal adjacent tiles when moving
- **Tile Revealing**: Current tile always revealed, adjacent tiles randomly

#### 5. Economy
- **Resources**:
  - Energy (consumed by mining)
  - Cash (earned by selling ores)
  - Health (damaged by falling)
- **Ore Values**: Iron ($5), Copper ($10), Silver ($20), Gold ($50)
- **Ore Quantities**: Variable drops (1, 2, 5, or 10 units per tile)

#### 6. Buildings (Surface)
- **Elevator**: Entry/exit point with 2-tile-wide shaft
- **Store**: Purchase energy ($0.10/unit) and upgrades
- **Assayer**: Sell collected ores for cash
- **Medical**: Restore health and reset discovery ($50)

#### 7. Progression Systems
- **Depth Limit**: Initially 50m, expandable through purchases
- **Upgrades**: Improved Pickaxe (10% energy reduction)
- **Death Penalty**: Lose 80% of cash and ores, respawn at hospital

#### 8. Emergency Systems
- **Low Energy Warning**: Persistent UI panel when <100 energy underground
- **Emergency Purchase**: Buy energy at 10x price from "trolls"
- **Rescue Option**: Return to surface but lose all collected ores

## Current State & Configuration

### Player Starting Resources
- Health: 100/100
- Energy: 1000/1000 (overridden for testing)
- Cash: $500 (overridden for testing)
- Starting Position: Near elevator on surface

### World Parameters
- Surface Y: 200 pixels
- Tile Types: Dirt, Clay, Stone, Iron, Copper, Silver, Gold
- Max Depth: 50m (configurable)
- World Width: 32 tiles

### Controls
- **Movement**: WASD or Arrow keys
- **Interact**: Space or E (at buildings)
- **Mobile**: Touch controls for movement

## Save System
Currently disabled for testing. When enabled:
- Saves to localStorage every 30 seconds
- Preserves player position, resources, inventory, and upgrades
- Tracks discovered tiles and world state

## Visual Features
- **Screen Shake**: On impact after falling
- **Mining Messages**: Enhanced feedback for ore discovery
- **Ore Sparkles**: Visual effects on valuable tiles
- **Impact Flash**: Red screen flash on fall damage
- **Depth Markers**: Every 10m in elevator shaft

## Performance Optimizations
- Viewport culling (only render visible tiles)
- Sparse world storage (Map instead of 2D array)
- Efficient tile lookup with coordinate hashing

## Known Mechanics
- Player is 32x32 pixels (matches tile size)
- Building width: 96 pixels (3 tiles)
- Elevator shaft: 64 pixels (2 tiles)
- All buildings are grid-aligned for clean visuals

## Future Expansion Points
The architecture supports easy addition of:
- New tile types and ores
- Additional buildings and services
- More upgrade types
- Deeper mining licenses
- New hazards or mechanics
- Multiplayer features
- Achievement system