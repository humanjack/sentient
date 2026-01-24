/**
 * AbilitySystem.js - Manages all player abilities.
 */
import { AbilityDash } from './abilities/AbilityDash.js';
import { AbilityFlashBang } from './abilities/AbilityFlashBang.js';
import { AbilityFireWall } from './abilities/AbilityFireWall.js';
import { AbilityUltimate } from './abilities/AbilityUltimate.js';
import { AudioManager } from '../audio/AudioManager.js';

export class AbilitySystem {
    /**
     * Create ability system.
     * @param {Object} options
     * @param {function} options.getPlayerPosition - Get player position
     * @param {function} options.getPlayerDirection - Get player movement direction
     * @param {function} options.setPlayerPosition - Set player position (for dash)
     * @param {function} options.getEnemies - Get all active enemies
     * @param {Scene} options.scene - Babylon.js scene
     * @param {PlayerHealth} options.playerHealth - Player health system
     * @param {function} options.onUltimateReady - Called when ultimate becomes ready
     * @param {function} options.onAbilityUsed - Called when any ability is used
     */
    constructor(options = {}) {
        this.getPlayerPosition = options.getPlayerPosition;
        this.getPlayerDirection = options.getPlayerDirection;
        this.setPlayerPosition = options.setPlayerPosition;
        this.getEnemies = options.getEnemies;
        this.scene = options.scene;
        this.playerHealth = options.playerHealth;
        this.onUltimateReady = options.onUltimateReady;
        this.onAbilityUsed = options.onAbilityUsed;

        // Abilities mapped by key
        this.abilities = new Map();

        // Ultimate charge
        this.ultimateCharge = 0;
        this.killsForUltimate = 10;
        this.chargePerKill = 100 / this.killsForUltimate; // 10% per kill

        // Setup default abilities
        this.setupAbilities();

        console.log('AbilitySystem initialized');
    }

    /**
     * Setup default Blaze Agent abilities.
     */
    setupAbilities() {
        // E - Dash
        this.registerAbility('KeyE', new AbilityDash());

        // Q - Flashbang
        this.registerAbility('KeyQ', new AbilityFlashBang());

        // C - Fire Wall
        this.registerAbility('KeyC', new AbilityFireWall());

        // X - Ultimate
        this.registerAbility('KeyX', new AbilityUltimate());
    }

    /**
     * Register an ability with a key binding.
     * @param {string} key - Key code (e.g., 'KeyQ')
     * @param {Ability} ability - Ability instance
     */
    registerAbility(key, ability) {
        this.abilities.set(key, ability);
    }

    /**
     * Get an ability by key.
     * @param {string} key
     * @returns {Ability}
     */
    getAbility(key) {
        return this.abilities.get(key);
    }

    /**
     * Attempt to use an ability.
     * @param {string} key - Key code
     * @returns {boolean} - True if ability was used
     */
    useAbility(key) {
        const ability = this.abilities.get(key);
        if (!ability) return false;

        // Special handling for ultimate
        if (key === 'KeyX') {
            if (!ability.canUseWithCharge(this.ultimateCharge)) {
                console.log(`Ultimate not ready (${Math.floor(this.ultimateCharge)}%)`);
                return false;
            }
        } else if (!ability.canUse()) {
            return false;
        }

        // Build execution context
        const context = {
            playerPosition: this.getPlayerPosition ? this.getPlayerPosition() : null,
            playerDirection: this.getPlayerDirection ? this.getPlayerDirection() : null,
            setPlayerPosition: this.setPlayerPosition,
            scene: this.scene,
            getEnemies: this.getEnemies,
            playerHealth: this.playerHealth,
            onUltimateUsed: () => this.resetUltimateCharge(),
        };

        const success = ability.execute(context);

        if (success) {
            // Play ability sound
            this.playAbilitySound(ability);

            if (this.onAbilityUsed) {
                this.onAbilityUsed(ability);
            }
        }

        return success;
    }

    /**
     * Play sound for an ability.
     * @param {Ability} ability
     */
    playAbilitySound(ability) {
        const audioManager = AudioManager.getInstance();
        if (!audioManager) return;

        // Map ability names to sound names
        const soundMap = {
            'Dash': 'dash',
            'Flash Bang': 'flashbang',
            'Fire Wall': 'firewall',
            'Inferno': 'ultimate',
        };

        const soundName = soundMap[ability.name];
        if (soundName) {
            audioManager.playSound(soundName);
        }
    }

    /**
     * Add ultimate charge for a kill.
     */
    addKillCharge() {
        const wasReady = this.isUltimateReady();

        this.ultimateCharge = Math.min(100, this.ultimateCharge + this.chargePerKill);

        console.log(`Ultimate charge: ${Math.floor(this.ultimateCharge)}%`);

        // Notify when ultimate becomes ready
        if (!wasReady && this.isUltimateReady()) {
            console.log('ULTIMATE READY!');
            if (this.onUltimateReady) {
                this.onUltimateReady();
            }
        }
    }

    /**
     * Reset ultimate charge to 0.
     */
    resetUltimateCharge() {
        this.ultimateCharge = 0;
    }

    /**
     * Check if ultimate is ready.
     * @returns {boolean}
     */
    isUltimateReady() {
        return this.ultimateCharge >= 100;
    }

    /**
     * Get ultimate charge percentage.
     * @returns {number}
     */
    getUltimateCharge() {
        return this.ultimateCharge;
    }

    /**
     * Update all abilities (cooldowns).
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        for (const ability of this.abilities.values()) {
            ability.update(deltaTime);
        }
    }

    /**
     * Get all abilities info for HUD.
     * @returns {Array}
     */
    getAbilitiesInfo() {
        const info = [];

        for (const [key, ability] of this.abilities) {
            // Extract display key (e.g., 'KeyQ' -> 'Q')
            const displayKey = key.replace('Key', '');

            info.push({
                key: displayKey,
                name: ability.name,
                isReady: displayKey === 'X' ? this.isUltimateReady() : ability.canUse(),
                cooldownProgress: ability.getCooldownProgress(),
                remainingCooldown: ability.getRemainingCooldown(),
                isUltimate: displayKey === 'X',
            });
        }

        return info;
    }
}
