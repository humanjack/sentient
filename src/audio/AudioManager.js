/**
 * AudioManager.js - Handles all game audio using Web Audio API.
 * Singleton for easy access from anywhere.
 */
export class AudioManager {
    // Singleton instance
    static instance = null;

    static getInstance() {
        return AudioManager.instance;
    }

    /**
     * Create audio manager.
     * @param {Object} options
     */
    constructor(options = {}) {
        // Singleton
        AudioManager.instance = this;

        // Audio context
        this.audioContext = null;
        this.initialized = false;

        // Volume settings
        this.masterVolume = 1.0;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;

        // Sound storage
        this.sounds = new Map();
        this.musicTracks = new Map();

        // Currently playing music
        this.currentMusic = null;
        this.currentMusicSource = null;

        // Gain nodes
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;

        console.log('AudioManager created (not yet initialized - call init() after user interaction)');
    }

    /**
     * Initialize audio context. Must be called after user interaction.
     */
    async init() {
        if (this.initialized) return;

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            this.initialized = true;
            console.log('AudioManager initialized');

            // Load sounds
            await this.loadAllSounds();

        } catch (error) {
            console.warn('Failed to initialize AudioManager:', error);
        }
    }

    /**
     * Resume audio context if suspended.
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Load all game sounds.
     */
    async loadAllSounds() {
        // Sound definitions - URL will be relative to public folder
        const soundDefs = {
            // Weapons
            shoot_pistol: '/sounds/shoot_pistol.mp3',
            shoot_rifle: '/sounds/shoot_rifle.mp3',
            shoot_shotgun: '/sounds/shoot_shotgun.mp3',
            shoot_smg: '/sounds/shoot_smg.mp3',
            reload: '/sounds/reload.mp3',

            // Player
            player_hurt: '/sounds/player_hurt.mp3',
            player_death: '/sounds/player_death.mp3',
            dash: '/sounds/dash.mp3',
            flashbang: '/sounds/flashbang.mp3',
            firewall: '/sounds/firewall.mp3',
            ultimate: '/sounds/ultimate.mp3',

            // Enemies
            enemy_death: '/sounds/enemy_death.mp3',
            grunt_attack: '/sounds/grunt_attack.mp3',
            soldier_shoot: '/sounds/soldier_shoot.mp3',
            sniper_charge: '/sounds/sniper_charge.mp3',
            sniper_shoot: '/sounds/sniper_shoot.mp3',
            heavy_stomp: '/sounds/heavy_stomp.mp3',
            boss_laser: '/sounds/boss_laser.mp3',
            boss_slam: '/sounds/boss_slam.mp3',

            // UI/Game events
            wave_start: '/sounds/wave_start.mp3',
            wave_complete: '/sounds/wave_complete.mp3',
            purchase: '/sounds/purchase.mp3',
            purchase_fail: '/sounds/purchase_fail.mp3',
            button_click: '/sounds/button_click.mp3',
        };

        // Try to load each sound, but don't fail if not found
        for (const [name, url] of Object.entries(soundDefs)) {
            try {
                await this.loadSound(name, url);
            } catch (error) {
                // Sound file not found - that's ok, we'll use fallback beeps
                console.log(`Sound '${name}' not found - will use synthesized sound`);
            }
        }
    }

    /**
     * Load a sound from URL.
     * @param {string} name - Sound identifier
     * @param {string} url - URL to audio file
     */
    async loadSound(name, url) {
        if (!this.audioContext) return;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.sounds.set(name, audioBuffer);
            console.log(`Loaded sound: ${name}`);

        } catch (error) {
            throw new Error(`Failed to load sound ${name}: ${error.message}`);
        }
    }

    /**
     * Play a sound effect.
     * @param {string} name - Sound name
     * @param {Object} options - Optional settings
     */
    playSound(name, options = {}) {
        if (!this.initialized || !this.audioContext) {
            return;
        }

        const volume = options.volume || 1.0;
        const pitch = options.pitch || 1.0;

        // Check if we have the loaded sound
        if (this.sounds.has(name)) {
            this.playLoadedSound(name, volume, pitch);
        } else {
            // Use synthesized fallback sound
            this.playSynthesizedSound(name, volume);
        }
    }

    /**
     * Play a loaded sound buffer.
     */
    playLoadedSound(name, volume, pitch) {
        const buffer = this.sounds.get(name);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = pitch;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        source.start(0);
    }

    /**
     * Play a synthesized sound as fallback.
     * @param {string} name - Sound type
     * @param {number} volume - Volume multiplier
     */
    playSynthesizedSound(name, volume = 1.0) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

        // Configure based on sound type
        let duration = 0.1;
        let frequency = 440;
        let waveType = 'square';

        switch (name) {
            case 'shoot_pistol':
                frequency = 200;
                duration = 0.08;
                waveType = 'sawtooth';
                break;
            case 'shoot_rifle':
                frequency = 150;
                duration = 0.06;
                waveType = 'sawtooth';
                break;
            case 'shoot_shotgun':
                frequency = 100;
                duration = 0.15;
                waveType = 'sawtooth';
                break;
            case 'shoot_smg':
                frequency = 180;
                duration = 0.04;
                waveType = 'sawtooth';
                break;
            case 'reload':
                frequency = 300;
                duration = 0.3;
                waveType = 'triangle';
                break;
            case 'player_hurt':
                frequency = 150;
                duration = 0.2;
                waveType = 'sawtooth';
                break;
            case 'player_death':
                frequency = 80;
                duration = 0.5;
                waveType = 'sawtooth';
                break;
            case 'dash':
                frequency = 400;
                duration = 0.15;
                waveType = 'sine';
                break;
            case 'flashbang':
                frequency = 800;
                duration = 0.3;
                waveType = 'sine';
                break;
            case 'firewall':
                frequency = 200;
                duration = 0.4;
                waveType = 'sawtooth';
                break;
            case 'ultimate':
                frequency = 150;
                duration = 0.6;
                waveType = 'sawtooth';
                break;
            case 'enemy_death':
                frequency = 120;
                duration = 0.15;
                waveType = 'square';
                break;
            case 'grunt_attack':
                frequency = 100;
                duration = 0.1;
                waveType = 'sawtooth';
                break;
            case 'soldier_shoot':
                frequency = 160;
                duration = 0.08;
                waveType = 'sawtooth';
                break;
            case 'sniper_charge':
                frequency = 600;
                duration = 1.0;
                waveType = 'sine';
                // Rising pitch effect handled below
                break;
            case 'sniper_shoot':
                frequency = 100;
                duration = 0.2;
                waveType = 'sawtooth';
                break;
            case 'boss_laser':
                frequency = 300;
                duration = 0.5;
                waveType = 'sawtooth';
                break;
            case 'boss_slam':
                frequency = 60;
                duration = 0.4;
                waveType = 'square';
                break;
            case 'wave_start':
                frequency = 440;
                duration = 0.3;
                waveType = 'triangle';
                break;
            case 'wave_complete':
                frequency = 523;
                duration = 0.4;
                waveType = 'triangle';
                break;
            case 'purchase':
                frequency = 880;
                duration = 0.15;
                waveType = 'sine';
                break;
            case 'purchase_fail':
                frequency = 200;
                duration = 0.2;
                waveType = 'square';
                break;
            case 'button_click':
                frequency = 600;
                duration = 0.05;
                waveType = 'sine';
                break;
            default:
                frequency = 440;
                duration = 0.1;
        }

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Special handling for sniper charge - rising pitch
        if (name === 'sniper_charge') {
            oscillator.frequency.linearRampToValueAtTime(1200, this.audioContext.currentTime + duration);
        }

        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    /**
     * Set master volume.
     * @param {number} volume - 0 to 1
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * Set SFX volume.
     * @param {number} volume - 0 to 1
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    /**
     * Set music volume.
     * @param {number} volume - 0 to 1
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    /**
     * Play background music.
     * @param {string} name - Music track name
     * @param {boolean} loop - Whether to loop
     */
    playMusic(name, loop = true) {
        // Music implementation would go here
        // For now, we skip actual music files
        console.log(`Would play music: ${name} (loop: ${loop})`);
    }

    /**
     * Stop current music.
     */
    stopMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.stop();
            this.currentMusicSource = null;
            this.currentMusic = null;
        }
    }
}
