/**
 * Weapon.js - Base class for all weapons.
 * Handles ammo, fire rate, and basic shooting logic.
 */
export class Weapon {
    constructor(options = {}) {
        this.name = options.name || 'Weapon';
        this.damage = options.damage || 10;
        this.fireRate = options.fireRate || 500; // ms between shots
        this.maxAmmo = options.maxAmmo || 30;
        this.currentAmmo = options.currentAmmo || this.maxAmmo;
        this.reloadTime = options.reloadTime || 1500; // ms

        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;

        // Callbacks
        this.onFire = options.onFire || null;
        this.onReload = options.onReload || null;
        this.onReloadComplete = options.onReloadComplete || null;
        this.onEmpty = options.onEmpty || null;
    }

    /**
     * Check if weapon can fire.
     * @returns {boolean}
     */
    canFire() {
        if (this.isReloading) return false;
        if (this.currentAmmo <= 0) return false;

        const now = performance.now();
        if (now - this.lastFireTime < this.fireRate) return false;

        return true;
    }

    /**
     * Fire the weapon. Override in subclasses for specific behavior.
     * @param {Vector3} origin - Where the shot originates
     * @param {Vector3} direction - Direction of the shot
     * @param {Scene} scene - Babylon.js scene for raycasting
     * @returns {Object|null} Hit result or null
     */
    fire(origin, direction, scene) {
        if (!this.canFire()) {
            if (this.currentAmmo <= 0 && this.onEmpty) {
                this.onEmpty();
            }
            return null;
        }

        this.currentAmmo--;
        this.lastFireTime = performance.now();

        if (this.onFire) {
            this.onFire(this);
        }

        // Subclasses implement actual shooting
        return null;
    }

    /**
     * Start reloading.
     */
    reload() {
        if (this.isReloading) return;
        if (this.currentAmmo >= this.maxAmmo) return;

        this.isReloading = true;
        this.reloadStartTime = performance.now();

        if (this.onReload) {
            this.onReload(this);
        }

        console.log(`${this.name} reloading...`);
    }

    /**
     * Update reload state. Call every frame.
     */
    update() {
        if (this.isReloading) {
            const now = performance.now();
            if (now - this.reloadStartTime >= this.reloadTime) {
                this.isReloading = false;
                this.currentAmmo = this.maxAmmo;

                if (this.onReloadComplete) {
                    this.onReloadComplete(this);
                }

                console.log(`${this.name} reloaded! Ammo: ${this.currentAmmo}/${this.maxAmmo}`);
            }
        }
    }

    /**
     * Get ammo display string.
     * @returns {string}
     */
    getAmmoString() {
        if (this.isReloading) return 'RELOADING';
        return `${this.currentAmmo}/${this.maxAmmo}`;
    }

    /**
     * Refill ammo to max instantly.
     */
    refillAmmo() {
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;

        if (this.onReloadComplete) {
            this.onReloadComplete(this);
        }

        console.log(`${this.name} ammo refilled! ${this.currentAmmo}/${this.maxAmmo}`);
    }
}
