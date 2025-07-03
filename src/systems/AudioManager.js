// src/systems/AudioManager.js
export default class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        this.enabled = true;
        
        // Initialize audio context on first user interaction
        this.audioContext = null;
        this.initialized = false;
    }
    
    async init() {
        // Create audio context on first user interaction (required by browsers)
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Load all game sounds
        await this.loadSounds();
        await this.loadMusic();
        
        this.initialized = true;
    }
    
    async loadSounds() {
        // Define all sound effects with their paths
        const soundList = {
            // Mining sounds - arrays for variation
            'mine_dirt': [
                'assets/audio/sfx/mine-dirt-1.wav',
                'assets/audio/sfx/mine-dirt-2.wav',
                'assets/audio/sfx/mine-dirt-3.wav',
                'assets/audio/sfx/mine-dirt-4.wav',
                'assets/audio/sfx/mine-dirt-5.wav',
                'assets/audio/sfx/mine-dirt-6.wav'
            ],
            'mine_stone': [
                'assets/audio/sfx/mine_stone_1.mp3',
                'assets/audio/sfx/mine_stone_2.mp3',
                'assets/audio/sfx/mine_stone_3.mp3',
                'assets/audio/sfx/mine_stone_4.mp3',
                'assets/audio/sfx/mine_stone_5.mp3'
            ],
            'mine_ore': [
                'assets/audio/sfx/mine_ore_1.mp3',
                'assets/audio/sfx/mine_ore_2.mp3',
                'assets/audio/sfx/mine_ore_3.mp3',
                'assets/audio/sfx/mine_ore_4.mp3'
            ],
            
            // Discovery sounds
            'find_iron': 'assets/audio/sfx/find_iron.mp3',
            'find_copper': 'assets/audio/sfx/find_copper.mp3',
            'find_silver': 'assets/audio/sfx/find_silver.mp3',
            'find_gold': 'assets/audio/sfx/find_gold.mp3',
            
            // Movement sounds
            'footstep_surface': [
                'assets/audio/sfx/footstep_surface_1.mp3',
                'assets/audio/sfx/footstep_surface_2.mp3',
                'assets/audio/sfx/footstep_surface_3.mp3',
                'assets/audio/sfx/footstep_surface_4.mp3'
            ],
            'footstep_cave': [
                'assets/audio/sfx/footstep_cave_1.mp3',
                'assets/audio/sfx/footstep_cave_2.mp3',
                'assets/audio/sfx/footstep_cave_3.mp3',
                'assets/audio/sfx/footstep_cave_4.mp3'
            ],
            'elevator_start': 'assets/audio/sfx/elevator_start.mp3',
            'elevator_stop': 'assets/audio/sfx/elevator_stop.mp3',
            'elevator_loop': 'assets/audio/sfx/elevator_loop.mp3',
            
            // UI sounds
            'menu_open': 'assets/audio/sfx/menu_open.mp3',
            'menu_close': 'assets/audio/sfx/menu_close.mp3',
            'purchase': 'assets/audio/sfx/purchase.mp3',
            'sell_ore': 'assets/audio/sfx/sell_ore.mp3',
            'error': 'assets/audio/sfx/error.mp3',
            
            // Impact/damage sounds
            'fall_impact': 'assets/audio/sfx/fall_impact.mp3',
            'low_energy_warning': 'assets/audio/sfx/low_energy_warning.mp3',
            'death': 'assets/audio/sfx/death.mp3'
        };
        
        // Load each sound
        for (const [name, paths] of Object.entries(soundList)) {
            try {
                if (Array.isArray(paths)) {
                    // Load array of sound variations
                    this.sounds[name] = [];
                    for (const path of paths) {
                        const audio = await this.loadAudio(path);
                        this.sounds[name].push(audio);
                    }
                } else {
                    // Load single sound
                    this.sounds[name] = await this.loadAudio(paths);
                }
            } catch (error) {
                console.warn(`Failed to load sound: ${name}`, error);
            }
        }
    }
    
    async loadMusic() {
        const musicList = {
            'main_theme': 'assets/audio/music/2D-miner-main.mp3',
            'surface_theme': 'assets/audio/music/surface_theme.mp3',
            'cave_ambient': 'assets/audio/music/cave_ambient.mp3',
            'deep_cave': 'assets/audio/music/deep_cave.mp3',
            'danger_theme': 'assets/audio/music/danger_theme.mp3'
        };
        
        for (const [name, path] of Object.entries(musicList)) {
            try {
                this.music[name] = await this.loadAudio(path);
                this.music[name].loop = true; // Music should loop
            } catch (error) {
                console.warn(`Failed to load music: ${name}`, error);
            }
        }
    }
    
    async loadAudio(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            audio.addEventListener('canplaythrough', () => resolve(audio));
            audio.addEventListener('error', () => reject(new Error(`Failed to load ${path}`)));
        });
    }
    
    // Play a sound effect
    playSound(soundName, options = {}) {
        if (!this.enabled || !this.initialized) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        // Handle sound variations
        let selectedSound;
        if (Array.isArray(sound)) {
            // Pick a random variation
            const randomIndex = Math.floor(Math.random() * sound.length);
            selectedSound = sound[randomIndex];
        } else {
            selectedSound = sound;
        }
        
        // Check if the selected sound actually exists
        if (!selectedSound) {
            console.warn(`Sound not found or failed to load: ${soundName}`);
            return;
        }
        
        // Clone the audio element to allow overlapping plays
        const instance = selectedSound.cloneNode();
        instance.volume = this.sfxVolume * (options.volume || 1);
        
        // Apply pitch variation if specified
        if (options.pitch) {
            instance.playbackRate = options.pitch;
        }
        
        instance.play().catch(e => console.warn('Sound play failed:', e));
        
        return instance;
    }
    
    // Play or change background music
    playMusic(musicName, fadeTime = 1000) {
        if (!this.enabled || !this.initialized) return;
        
        const newMusic = this.music[musicName];
        if (!newMusic) {
            console.warn(`Music not found: ${musicName}`);
            return;
        }
        
        // Fade out current music
        if (this.currentMusic && this.currentMusic !== newMusic) {
            this.fadeOut(this.currentMusic, fadeTime);
        }
        
        // Fade in new music
        this.currentMusic = newMusic;
        this.currentMusic.volume = 0;
        this.currentMusic.play().catch(e => console.warn('Music play failed:', e));
        this.fadeIn(this.currentMusic, fadeTime);
    }
    
    // Stop current music
    stopMusic(fadeTime = 1000) {
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeTime, true);
            this.currentMusic = null;
        }
    }
    
    // Fade in audio
    fadeIn(audio, duration) {
        const targetVolume = this.musicVolume;
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            audio.volume = progress * targetVolume;
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }
    
    // Fade out audio
    fadeOut(audio, duration, stopAfter = false) {
        const startVolume = audio.volume;
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            audio.volume = startVolume * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else if (stopAfter) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
        
        fade();
    }
    
    // Play footstep sounds
    playFootstep(isUnderground) {
        const soundName = isUnderground ? 'footstep_cave' : 'footstep_surface';
        this.playSound(soundName, {
            volume: 0.3,
            pitch: 0.9 + Math.random() * 0.2 // Slight pitch variation
        });
    }
    
    // Play mining sound based on tile type
    playMiningSound(tileType) {
        const soundMap = {
            'DIRT': 'mine_dirt',
            'CLAY': 'mine_dirt',
            'STONE': 'mine_stone',
            'IRON': 'mine_ore',
            'COPPER': 'mine_ore',
            'SILVER': 'mine_ore',
            'GOLD': 'mine_ore'
        };
        
        const soundName = soundMap[tileType] || 'mine_dirt';
        this.playSound(soundName, {
            pitch: 0.95 + Math.random() * 0.1
        });
    }
    
    // Play ore discovery sound
    playOreDiscovery(oreType) {
        const soundMap = {
            'IRON': 'find_iron',
            'COPPER': 'find_copper',
            'SILVER': 'find_silver',
            'GOLD': 'find_gold'
        };
        
        const soundName = soundMap[oreType];
        if (soundName) {
            this.playSound(soundName);
        }
    }
    
    // Update music based on depth
    updateMusicByDepth(depth) {
        let musicName;
        
        if (depth <= 0) {
            musicName = 'surface_theme';
        } else if (depth < 20) {
            musicName = 'cave_ambient';
        } else if (depth < 40) {
            musicName = 'deep_cave';
        } else {
            musicName = 'danger_theme';
        }
        
        // Only change if different
        if (this.currentMusic !== this.music[musicName]) {
            this.playMusic(musicName);
        }
    }
    
    // Set volume levels
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Toggle audio on/off
    toggleAudio() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.currentMusic) {
            this.currentMusic.pause();
        } else if (this.enabled && this.currentMusic) {
            this.currentMusic.play();
        }
        return this.enabled;
    }
}