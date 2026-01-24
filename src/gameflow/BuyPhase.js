/**
 * BuyPhase.js - Manages buy phase logic and item purchases.
 */
import { ScoreManager } from './ScoreManager.js';
import { BuyMenuUI } from '../ui/BuyMenuUI.js';

export class BuyPhase {
    /**
     * Create buy phase manager.
     * @param {Object} options
     * @param {Scene} options.scene - Babylon.js scene
     * @param {PlayerHealth} options.playerHealth - Player health system
     * @param {function} options.getWeapon - Function to get player weapon
     * @param {function} options.getWeaponInventory - Function to get weapon inventory
     * @param {function} options.onSkip - Called when player skips/readies
     * @param {function} options.onControlsChanged - Called when control scheme changes
     */
    constructor(options = {}) {
        this.scene = options.scene;
        this.playerHealth = options.playerHealth;
        this.getWeapon = options.getWeapon || null;
        this.getWeaponInventory = options.getWeaponInventory || null;
        this.onSkipCallback = options.onSkip || null;
        this.onControlsChangedCallback = options.onControlsChanged || null;

        // State
        this.isOpen = false;

        // Item definitions
        this.items = {
            ammo: {
                name: 'Ammo Refill',
                cost: 200,
                effect: () => this.purchaseAmmo(),
            },
            health: {
                name: 'Health Pack',
                cost: 400,
                effect: () => this.purchaseHealth(),
            },
            shield: {
                name: 'Shield Recharge',
                cost: 300,
                effect: () => this.purchaseShield(),
            },
            shotgun: {
                name: 'Shotgun',
                cost: 800,
                effect: () => this.purchaseWeapon('shotgun'),
                isWeapon: true,
            },
            smg: {
                name: 'SMG',
                cost: 1200,
                effect: () => this.purchaseWeapon('smg'),
                isWeapon: true,
            },
        };

        // Create UI
        this.ui = new BuyMenuUI(
            this.scene,
            (itemId) => this.purchaseItem(itemId),
            () => this.skip()
        );

        // Set up controls changed callback
        this.ui.setOnControlsChanged((scheme) => {
            if (this.onControlsChangedCallback) {
                this.onControlsChangedCallback(scheme);
            }
        });

        console.log('BuyPhase initialized');
    }

    /**
     * Open the buy menu.
     */
    open() {
        if (this.isOpen) return;

        this.isOpen = true;

        // Update credits in UI
        const scoreManager = ScoreManager.getInstance();
        if (scoreManager) {
            this.ui.updateCredits(scoreManager.getCredits());
        }

        // Update owned weapons in UI
        if (this.getWeaponInventory) {
            const inventory = this.getWeaponInventory();
            if (inventory) {
                this.ui.setOwnedWeapons(inventory.ownedWeapons);
            }
        }

        this.ui.show();
        console.log('Buy menu opened');
    }

    /**
     * Close the buy menu.
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.ui.hide();
        console.log('Buy menu closed');
    }

    /**
     * Toggle the buy menu.
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Skip buy phase / ready for next wave.
     */
    skip() {
        this.close();

        if (this.onSkipCallback) {
            this.onSkipCallback();
        }
    }

    /**
     * Attempt to purchase an item.
     * @param {string} itemId - ID of item to purchase
     * @returns {boolean} - True if purchase successful
     */
    purchaseItem(itemId) {
        const item = this.items[itemId];
        if (!item) {
            console.log(`Unknown item: ${itemId}`);
            return false;
        }

        // Check if weapon is already owned
        if (item.isWeapon && this.getWeaponInventory) {
            const inventory = this.getWeaponInventory();
            if (inventory && inventory.hasWeapon(itemId)) {
                console.log(`${item.name} already owned`);
                return false;
            }
        }

        const scoreManager = ScoreManager.getInstance();
        if (!scoreManager) {
            console.log('ScoreManager not available');
            return false;
        }

        // Try to spend credits
        if (!scoreManager.spendCredits(item.cost)) {
            console.log(`Can't afford ${item.name} ($${item.cost})`);
            return false;
        }

        // Apply effect
        item.effect();

        // Update UI with new credits
        this.ui.updateCredits(scoreManager.getCredits());

        console.log(`Purchased ${item.name}!`);
        return true;
    }

    /**
     * Purchase ammo refill.
     */
    purchaseAmmo() {
        // Use weapon inventory if available
        if (this.getWeaponInventory) {
            const inventory = this.getWeaponInventory();
            if (inventory) {
                inventory.refillAllAmmo();
                return;
            }
        }
        // Fallback to single weapon
        if (this.getWeapon) {
            const weapon = this.getWeapon();
            if (weapon) {
                weapon.refillAmmo();
            }
        }
    }

    /**
     * Purchase health pack.
     */
    purchaseHealth() {
        if (this.playerHealth) {
            this.playerHealth.heal(50);
        }
    }

    /**
     * Purchase shield recharge.
     */
    purchaseShield() {
        if (this.playerHealth) {
            this.playerHealth.restoreShield(50);
        }
    }

    /**
     * Purchase/unlock a weapon.
     * @param {string} weaponId - Weapon identifier
     */
    purchaseWeapon(weaponId) {
        if (this.getWeaponInventory) {
            const inventory = this.getWeaponInventory();
            if (inventory) {
                inventory.unlockWeapon(weaponId);
                // Update UI to show weapon as owned
                this.ui.setOwnedWeapons(inventory.ownedWeapons);
            }
        }
    }

    /**
     * Update timer display.
     * @param {number} seconds
     */
    updateTimer(seconds) {
        this.ui.updateTimer(seconds);
    }

    /**
     * Update credits display.
     */
    refreshCredits() {
        const scoreManager = ScoreManager.getInstance();
        if (scoreManager) {
            this.ui.updateCredits(scoreManager.getCredits());
        }
    }

    /**
     * Check if buy menu is open.
     * @returns {boolean}
     */
    isMenuOpen() {
        return this.isOpen;
    }

    /**
     * Dispose of resources.
     */
    dispose() {
        this.ui.dispose();
    }
}
