/**
 * PlayerHealth.js - Manages player health and shield.
 */
export class PlayerHealth {
    /**
     * Create player health system.
     * @param {Object} options
     * @param {function} options.onHealthChanged - Called when health changes
     * @param {function} options.onShieldChanged - Called when shield changes
     * @param {function} options.onDamage - Called when player takes damage
     * @param {function} options.onDeath - Called when player dies
     */
    constructor(options = {}) {
        // Health
        this.maxHealth = 100;
        this.currentHealth = 100;

        // Shield
        this.maxShield = 50;
        this.currentShield = 50;

        // Status
        this.isAlive = true;
        this.isInvincible = false;

        // Callbacks
        this.onHealthChanged = options.onHealthChanged || null;
        this.onShieldChanged = options.onShieldChanged || null;
        this.onDamage = options.onDamage || null;
        this.onDeath = options.onDeath || null;

        console.log('PlayerHealth initialized - HP: 100, Shield: 50');
    }

    /**
     * Set invincibility state (for abilities like dash).
     * @param {boolean} invincible
     */
    setInvincible(invincible) {
        this.isInvincible = invincible;
    }

    /**
     * Take damage - shield absorbs first, then health.
     * @param {number} amount - Damage amount
     */
    takeDamage(amount) {
        if (!this.isAlive || amount <= 0) return;

        // Skip damage if invincible
        if (this.isInvincible) {
            console.log('Damage blocked - invincible!');
            return;
        }

        let remaining = amount;

        // Shield absorbs damage first
        if (this.currentShield > 0) {
            if (this.currentShield >= remaining) {
                this.currentShield -= remaining;
                remaining = 0;
            } else {
                remaining -= this.currentShield;
                this.currentShield = 0;
            }

            // Notify shield changed
            if (this.onShieldChanged) {
                this.onShieldChanged(this.currentShield, this.maxShield);
            }
        }

        // Remaining damage goes to health
        if (remaining > 0) {
            this.currentHealth -= remaining;

            // Notify health changed
            if (this.onHealthChanged) {
                this.onHealthChanged(this.currentHealth, this.maxHealth);
            }
        }

        // Notify damage taken
        if (this.onDamage) {
            this.onDamage(amount);
        }

        console.log(`Player took ${amount} damage! HP: ${this.currentHealth}/${this.maxHealth}, Shield: ${this.currentShield}/${this.maxShield}`);

        // Check for death
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    /**
     * Heal the player.
     * @param {number} amount - Health to restore
     */
    heal(amount) {
        if (!this.isAlive || amount <= 0) return;

        const oldHealth = this.currentHealth;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

        if (this.currentHealth !== oldHealth && this.onHealthChanged) {
            this.onHealthChanged(this.currentHealth, this.maxHealth);
        }

        console.log(`Player healed ${this.currentHealth - oldHealth}! HP: ${this.currentHealth}/${this.maxHealth}`);
    }

    /**
     * Restore shield.
     * @param {number} amount - Shield to restore
     */
    restoreShield(amount) {
        if (!this.isAlive || amount <= 0) return;

        const oldShield = this.currentShield;
        this.currentShield = Math.min(this.maxShield, this.currentShield + amount);

        if (this.currentShield !== oldShield && this.onShieldChanged) {
            this.onShieldChanged(this.currentShield, this.maxShield);
        }

        console.log(`Player shield restored ${this.currentShield - oldShield}! Shield: ${this.currentShield}/${this.maxShield}`);
    }

    /**
     * Kill the player.
     */
    die() {
        if (!this.isAlive) return;

        this.isAlive = false;
        this.currentHealth = 0;

        console.log('Player died!');

        if (this.onDeath) {
            this.onDeath();
        }
    }

    /**
     * Reset health and shield to max.
     */
    reset() {
        this.currentHealth = this.maxHealth;
        this.currentShield = this.maxShield;
        this.isAlive = true;

        if (this.onHealthChanged) {
            this.onHealthChanged(this.currentHealth, this.maxHealth);
        }
        if (this.onShieldChanged) {
            this.onShieldChanged(this.currentShield, this.maxShield);
        }
    }

    /**
     * Get current health percentage.
     * @returns {number} 0-1 percentage
     */
    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }

    /**
     * Get current shield percentage.
     * @returns {number} 0-1 percentage
     */
    getShieldPercent() {
        return this.currentShield / this.maxShield;
    }
}
