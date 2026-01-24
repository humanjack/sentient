/**
 * WeaponInventory.js - Manages player's weapon collection.
 */
import { WeaponPistol } from '../combat/WeaponPistol.js';
import { WeaponRifle } from '../combat/WeaponRifle.js';
import { WeaponShotgun } from '../combat/WeaponShotgun.js';
import { WeaponSMG } from '../combat/WeaponSMG.js';

export class WeaponInventory {
    /**
     * Create weapon inventory.
     * @param {Object} options
     * @param {function} options.onWeaponSwitch - Called when weapon switches
     * @param {function} options.onFire - Called when any weapon fires
     * @param {function} options.onReload - Called when reloading starts
     * @param {function} options.onReloadComplete - Called when reloading finishes
     * @param {function} options.onEmpty - Called when weapon is empty
     */
    constructor(options = {}) {
        this.onWeaponSwitch = options.onWeaponSwitch || null;
        this.onFire = options.onFire || null;
        this.onReload = options.onReload || null;
        this.onReloadComplete = options.onReloadComplete || null;
        this.onEmpty = options.onEmpty || null;

        // Weapons by slot (1-4)
        this.weapons = new Map();

        // Which weapons are owned/unlocked
        this.ownedWeapons = new Set();

        // Current weapon slot
        this.currentWeaponSlot = 1;

        // Setup default loadout
        this.setupDefaultLoadout();

        console.log('WeaponInventory initialized');
    }

    /**
     * Setup the default starting loadout.
     */
    setupDefaultLoadout() {
        // Slot 1: Pistol (always owned)
        const pistol = new WeaponPistol({
            onFire: () => this.handleFire(),
            onReload: () => this.handleReload(),
            onReloadComplete: () => this.handleReloadComplete(),
            onEmpty: () => this.handleEmpty(),
        });
        this.addWeapon(1, pistol);
        this.ownedWeapons.add('pistol');

        // Slot 2: Rifle (starts owned)
        const rifle = new WeaponRifle({
            onFire: () => this.handleFire(),
            onReload: () => this.handleReload(),
            onReloadComplete: () => this.handleReloadComplete(),
            onEmpty: () => this.handleEmpty(),
        });
        this.addWeapon(2, rifle);
        this.ownedWeapons.add('rifle');

        // Slot 3: Shotgun (must be purchased)
        const shotgun = new WeaponShotgun({
            onFire: () => this.handleFire(),
            onReload: () => this.handleReload(),
            onReloadComplete: () => this.handleReloadComplete(),
            onEmpty: () => this.handleEmpty(),
        });
        this.addWeapon(3, shotgun);
        // Not owned by default

        // Slot 4: SMG (must be purchased)
        const smg = new WeaponSMG({
            onFire: () => this.handleFire(),
            onReload: () => this.handleReload(),
            onReloadComplete: () => this.handleReloadComplete(),
            onEmpty: () => this.handleEmpty(),
        });
        this.addWeapon(4, smg);
        // Not owned by default

        // Start with rifle selected
        this.currentWeaponSlot = 2;
    }

    /**
     * Add a weapon to a slot.
     * @param {number} slot - Slot number (1-4)
     * @param {Weapon} weapon - Weapon instance
     */
    addWeapon(slot, weapon) {
        this.weapons.set(slot, weapon);
    }

    /**
     * Switch to a weapon by slot.
     * @param {number} slot - Slot number (1-4)
     * @returns {boolean} - True if switch successful
     */
    switchWeapon(slot) {
        if (!this.weapons.has(slot)) {
            console.log(`No weapon in slot ${slot}`);
            return false;
        }

        const weapon = this.weapons.get(slot);
        const weaponId = weapon.name.toLowerCase();

        if (!this.ownedWeapons.has(weaponId)) {
            console.log(`${weapon.name} not owned - purchase in buy phase!`);
            return false;
        }

        if (this.currentWeaponSlot === slot) {
            return true; // Already equipped
        }

        this.currentWeaponSlot = slot;

        console.log(`Switched to ${weapon.name} (slot ${slot})`);

        if (this.onWeaponSwitch) {
            this.onWeaponSwitch(weapon, slot);
        }

        return true;
    }

    /**
     * Unlock/purchase a weapon.
     * @param {string} weaponId - Weapon identifier (lowercase name)
     */
    unlockWeapon(weaponId) {
        this.ownedWeapons.add(weaponId.toLowerCase());
        console.log(`Unlocked weapon: ${weaponId}`);
    }

    /**
     * Check if player owns a weapon.
     * @param {string} weaponId
     * @returns {boolean}
     */
    hasWeapon(weaponId) {
        return this.ownedWeapons.has(weaponId.toLowerCase());
    }

    /**
     * Get the currently equipped weapon.
     * @returns {Weapon}
     */
    getCurrentWeapon() {
        return this.weapons.get(this.currentWeaponSlot);
    }

    /**
     * Get current weapon slot.
     * @returns {number}
     */
    getCurrentSlot() {
        return this.currentWeaponSlot;
    }

    /**
     * Get weapon by slot.
     * @param {number} slot
     * @returns {Weapon}
     */
    getWeapon(slot) {
        return this.weapons.get(slot);
    }

    /**
     * Check if a slot is owned.
     * @param {number} slot
     * @returns {boolean}
     */
    isSlotOwned(slot) {
        const weapon = this.weapons.get(slot);
        if (!weapon) return false;
        return this.ownedWeapons.has(weapon.name.toLowerCase());
    }

    /**
     * Refill ammo for all weapons.
     */
    refillAllAmmo() {
        for (const weapon of this.weapons.values()) {
            weapon.refillAmmo();
        }
        console.log('All weapons ammo refilled!');
    }

    /**
     * Update all weapons (for reload timers).
     */
    update() {
        for (const weapon of this.weapons.values()) {
            weapon.update();
        }
    }

    /**
     * Handle fire callback.
     */
    handleFire() {
        if (this.onFire) {
            this.onFire(this.getCurrentWeapon());
        }
    }

    /**
     * Handle reload callback.
     */
    handleReload() {
        if (this.onReload) {
            this.onReload(this.getCurrentWeapon());
        }
    }

    /**
     * Handle reload complete callback.
     */
    handleReloadComplete() {
        if (this.onReloadComplete) {
            this.onReloadComplete(this.getCurrentWeapon());
        }
    }

    /**
     * Handle empty callback.
     */
    handleEmpty() {
        if (this.onEmpty) {
            this.onEmpty(this.getCurrentWeapon());
        }
    }

    /**
     * Get all weapons info for HUD.
     * @returns {Array}
     */
    getAllWeaponsInfo() {
        const info = [];
        for (let slot = 1; slot <= 4; slot++) {
            const weapon = this.weapons.get(slot);
            if (weapon) {
                info.push({
                    slot,
                    name: weapon.name,
                    owned: this.ownedWeapons.has(weapon.name.toLowerCase()),
                    current: slot === this.currentWeaponSlot,
                    ammo: weapon.getAmmoString(),
                });
            }
        }
        return info;
    }
}
