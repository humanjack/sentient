/**
 * Ability.js - Base class for all player abilities.
 */
export class Ability {
    /**
     * Create an ability.
     * @param {Object} options
     * @param {string} options.name - Ability name
     * @param {number} options.cooldown - Cooldown in seconds
     * @param {string} options.key - Key binding (for display)
     */
    constructor(options = {}) {
        this.name = options.name || 'Ability';
        this.cooldown = options.cooldown || 10;
        this.key = options.key || '?';

        this.currentCooldown = 0;
        this.isReady = true;
    }

    /**
     * Check if ability can be used.
     * @returns {boolean}
     */
    canUse() {
        return this.isReady && this.currentCooldown <= 0;
    }

    /**
     * Execute the ability. Override in subclasses.
     * @param {Object} context - Execution context
     * @param {Vector3} context.playerPosition - Player position
     * @param {Vector3} context.playerDirection - Player facing direction
     * @param {Scene} context.scene - Babylon.js scene
     * @param {function} context.getEnemies - Function to get all enemies
     * @param {PlayerHealth} context.playerHealth - Player health system
     * @returns {boolean} - True if ability was executed
     */
    execute(context) {
        if (!this.canUse()) {
            return false;
        }

        this.startCooldown();
        return true;
    }

    /**
     * Start the cooldown timer.
     */
    startCooldown() {
        this.currentCooldown = this.cooldown;
        this.isReady = false;
    }

    /**
     * Update cooldown timer.
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;

            if (this.currentCooldown <= 0) {
                this.currentCooldown = 0;
                this.isReady = true;
            }
        }
    }

    /**
     * Get cooldown progress (0-1, where 1 is ready).
     * @returns {number}
     */
    getCooldownProgress() {
        if (this.isReady) return 1;
        return 1 - (this.currentCooldown / this.cooldown);
    }

    /**
     * Get remaining cooldown in seconds.
     * @returns {number}
     */
    getRemainingCooldown() {
        return Math.ceil(this.currentCooldown);
    }
}
