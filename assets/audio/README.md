# Audio Assets

This folder contains placeholder structure for game audio files.

## Structure

- `/sfx/` - Sound effects
  - Mining sounds (with variations for natural sound):
    - mine_dirt_1.mp3, mine_dirt_2.mp3, mine_dirt_3.mp3, mine_dirt_4.mp3, mine_dirt_5.mp3
    - mine_stone_1.mp3, mine_stone_2.mp3, mine_stone_3.mp3, mine_stone_4.mp3, mine_stone_5.mp3
    - mine_ore_1.mp3, mine_ore_2.mp3, mine_ore_3.mp3, mine_ore_4.mp3
  - Discovery sounds:
    - find_iron.mp3, find_copper.mp3, find_silver.mp3, find_gold.mp3
  - Movement sounds (with variations):
    - footstep_surface_1.mp3, footstep_surface_2.mp3, footstep_surface_3.mp3, footstep_surface_4.mp3
    - footstep_cave_1.mp3, footstep_cave_2.mp3, footstep_cave_3.mp3, footstep_cave_4.mp3
    - elevator_start.mp3, elevator_stop.mp3, elevator_loop.mp3
  - UI sounds:
    - menu_open.mp3, menu_close.mp3, purchase.mp3, sell_ore.mp3, error.mp3
  - Impact/damage sounds:
    - fall_impact.mp3, low_energy_warning.mp3, death.mp3

- `/music/` - Background music
  - surface_theme.mp3
  - cave_ambient.mp3
  - deep_cave.mp3
  - danger_theme.mp3

## File Format Support

The system supports MP3, WAV, and OGG audio files. Simply use the appropriate file extension and the AudioManager will handle it.

## Sound Variations

Repetitive sounds like mining and footsteps use multiple variations to create a more natural, less repetitive audio experience. The AudioManager randomly selects from available variations when playing these sounds.

## Note

Add actual audio files here to enable sound in the game. The AudioManager will gracefully handle missing files by logging warnings to the console.