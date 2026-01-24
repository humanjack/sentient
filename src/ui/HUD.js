/**
 * HUD.js - Heads-up display using Babylon.js GUI.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class HUD {
    /**
     * Create HUD.
     * @param {Scene} scene - Babylon.js scene
     */
    constructor(scene) {
        this.scene = scene;

        // Create fullscreen GUI
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('HUD', true, scene);

        // Create display elements
        this.createWaveDisplay();
        this.createEnemyCountDisplay();
        this.createScoreDisplay();
        this.createCreditsDisplay();
        this.createMessageDisplay();
        this.createBuyPhaseDisplay();
        this.createHealthBars();
        this.createDamageFlash();
        this.createWeaponDisplay();
        this.createControlsIndicator();

        // Track active popups for cleanup
        this.activePopups = [];

        console.log('HUD initialized');
    }

    /**
     * Create wave number display (top center).
     */
    createWaveDisplay() {
        this.waveText = new TextBlock('waveText');
        this.waveText.text = 'Wave 1';
        this.waveText.color = '#66ffff';
        this.waveText.fontSize = 32;
        this.waveText.fontFamily = 'Courier New, monospace';
        this.waveText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.waveText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.waveText.top = '20px';
        this.waveText.shadowColor = 'black';
        this.waveText.shadowBlur = 4;
        this.waveText.shadowOffsetX = 2;
        this.waveText.shadowOffsetY = 2;

        this.gui.addControl(this.waveText);
    }

    /**
     * Create enemy count display (top left).
     */
    createEnemyCountDisplay() {
        this.enemyCountText = new TextBlock('enemyCountText');
        this.enemyCountText.text = 'Enemies: 0';
        this.enemyCountText.color = '#ff6666';
        this.enemyCountText.fontSize = 24;
        this.enemyCountText.fontFamily = 'Courier New, monospace';
        this.enemyCountText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.enemyCountText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.enemyCountText.left = '20px';
        this.enemyCountText.top = '20px';
        this.enemyCountText.shadowColor = 'black';
        this.enemyCountText.shadowBlur = 4;
        this.enemyCountText.shadowOffsetX = 2;
        this.enemyCountText.shadowOffsetY = 2;

        this.gui.addControl(this.enemyCountText);
    }

    /**
     * Create score display (top right).
     */
    createScoreDisplay() {
        this.scoreText = new TextBlock('scoreText');
        this.scoreText.text = 'Score: 0';
        this.scoreText.color = '#ffff66';
        this.scoreText.fontSize = 24;
        this.scoreText.fontFamily = 'Courier New, monospace';
        this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.scoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.scoreText.left = '-20px';
        this.scoreText.top = '20px';
        this.scoreText.shadowColor = 'black';
        this.scoreText.shadowBlur = 4;
        this.scoreText.shadowOffsetX = 2;
        this.scoreText.shadowOffsetY = 2;

        this.gui.addControl(this.scoreText);
    }

    /**
     * Create credits display (top right, below score).
     */
    createCreditsDisplay() {
        this.creditsText = new TextBlock('creditsText');
        this.creditsText.text = '$ 0';
        this.creditsText.color = '#66ff66';
        this.creditsText.fontSize = 24;
        this.creditsText.fontFamily = 'Courier New, monospace';
        this.creditsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.creditsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.creditsText.left = '-20px';
        this.creditsText.top = '50px';
        this.creditsText.shadowColor = 'black';
        this.creditsText.shadowBlur = 4;
        this.creditsText.shadowOffsetX = 2;
        this.creditsText.shadowOffsetY = 2;

        this.gui.addControl(this.creditsText);
    }

    /**
     * Create message display (center, for announcements).
     */
    createMessageDisplay() {
        this.messageText = new TextBlock('messageText');
        this.messageText.text = '';
        this.messageText.color = '#ffff66';
        this.messageText.fontSize = 48;
        this.messageText.fontFamily = 'Courier New, monospace';
        this.messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.messageText.shadowColor = 'black';
        this.messageText.shadowBlur = 6;
        this.messageText.shadowOffsetX = 3;
        this.messageText.shadowOffsetY = 3;
        this.messageText.alpha = 0;

        this.gui.addControl(this.messageText);

        // Message fade timeout
        this.messageTimeout = null;
    }

    /**
     * Create buy phase indicator (top right, below credits).
     */
    createBuyPhaseDisplay() {
        // Container for buy phase indicator
        this.buyPhaseContainer = new Rectangle('buyPhaseContainer');
        this.buyPhaseContainer.width = '180px';
        this.buyPhaseContainer.height = '50px';
        this.buyPhaseContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.buyPhaseContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.buyPhaseContainer.left = '-20px';
        this.buyPhaseContainer.top = '80px';
        this.buyPhaseContainer.background = 'rgba(0, 100, 0, 0.7)';
        this.buyPhaseContainer.thickness = 2;
        this.buyPhaseContainer.color = '#44ff44';
        this.buyPhaseContainer.cornerRadius = 8;
        this.buyPhaseContainer.isVisible = false;

        this.gui.addControl(this.buyPhaseContainer);

        // Buy phase text
        this.buyPhaseText = new TextBlock('buyPhaseText');
        this.buyPhaseText.text = '[B] BUY (15s)';
        this.buyPhaseText.color = '#44ff44';
        this.buyPhaseText.fontSize = 18;
        this.buyPhaseText.fontFamily = 'Courier New, monospace';
        this.buyPhaseText.fontWeight = 'bold';
        this.buyPhaseText.shadowColor = 'black';
        this.buyPhaseText.shadowBlur = 2;

        this.buyPhaseContainer.addControl(this.buyPhaseText);
    }

    /**
     * Create health and shield bars (bottom left).
     */
    createHealthBars() {
        // Container for bars
        this.barsContainer = new StackPanel('barsContainer');
        this.barsContainer.width = '220px';
        this.barsContainer.height = '80px';
        this.barsContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.barsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.barsContainer.left = '20px';
        this.barsContainer.top = '-80px';

        this.gui.addControl(this.barsContainer);

        // Shield bar background
        this.shieldBarBg = new Rectangle('shieldBarBg');
        this.shieldBarBg.width = '200px';
        this.shieldBarBg.height = '20px';
        this.shieldBarBg.background = '#222244';
        this.shieldBarBg.thickness = 2;
        this.shieldBarBg.color = '#4444aa';
        this.shieldBarBg.cornerRadius = 4;

        this.barsContainer.addControl(this.shieldBarBg);

        // Shield bar fill
        this.shieldBarFill = new Rectangle('shieldBarFill');
        this.shieldBarFill.width = '196px';
        this.shieldBarFill.height = '16px';
        this.shieldBarFill.background = '#4488ff';
        this.shieldBarFill.thickness = 0;
        this.shieldBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.shieldBarFill.left = '2px';
        this.shieldBarFill.cornerRadius = 2;

        this.shieldBarBg.addControl(this.shieldBarFill);

        // Shield text
        this.shieldText = new TextBlock('shieldText');
        this.shieldText.text = '50/50';
        this.shieldText.color = 'white';
        this.shieldText.fontSize = 14;
        this.shieldText.fontFamily = 'Courier New, monospace';

        this.shieldBarBg.addControl(this.shieldText);

        // Health bar background
        this.healthBarBg = new Rectangle('healthBarBg');
        this.healthBarBg.width = '200px';
        this.healthBarBg.height = '25px';
        this.healthBarBg.background = '#442222';
        this.healthBarBg.thickness = 2;
        this.healthBarBg.color = '#aa4444';
        this.healthBarBg.cornerRadius = 4;
        this.healthBarBg.paddingTop = '5px';

        this.barsContainer.addControl(this.healthBarBg);

        // Health bar fill
        this.healthBarFill = new Rectangle('healthBarFill');
        this.healthBarFill.width = '196px';
        this.healthBarFill.height = '21px';
        this.healthBarFill.background = '#44ff44';
        this.healthBarFill.thickness = 0;
        this.healthBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.healthBarFill.left = '2px';
        this.healthBarFill.cornerRadius = 2;

        this.healthBarBg.addControl(this.healthBarFill);

        // Health text
        this.healthText = new TextBlock('healthText');
        this.healthText.text = '100/100';
        this.healthText.color = 'white';
        this.healthText.fontSize = 16;
        this.healthText.fontFamily = 'Courier New, monospace';
        this.healthText.fontWeight = 'bold';

        this.healthBarBg.addControl(this.healthText);
    }

    /**
     * Create damage flash overlay.
     */
    createDamageFlash() {
        this.damageFlash = new Rectangle('damageFlash');
        this.damageFlash.width = '100%';
        this.damageFlash.height = '100%';
        this.damageFlash.background = 'rgba(255, 0, 0, 0.3)';
        this.damageFlash.thickness = 0;
        this.damageFlash.alpha = 0;

        this.gui.addControl(this.damageFlash);
    }

    /**
     * Create weapon display (bottom right).
     */
    createWeaponDisplay() {
        // Container for weapon info
        this.weaponContainer = new StackPanel('weaponContainer');
        this.weaponContainer.width = '200px';
        this.weaponContainer.height = '80px';
        this.weaponContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.weaponContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.weaponContainer.left = '-20px';
        this.weaponContainer.top = '-20px';

        this.gui.addControl(this.weaponContainer);

        // Weapon name
        this.weaponNameText = new TextBlock('weaponName');
        this.weaponNameText.text = 'Rifle';
        this.weaponNameText.color = '#ffaa44';
        this.weaponNameText.fontSize = 24;
        this.weaponNameText.fontFamily = 'Courier New, monospace';
        this.weaponNameText.fontWeight = 'bold';
        this.weaponNameText.height = '30px';
        this.weaponNameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.weaponNameText.shadowColor = 'black';
        this.weaponNameText.shadowBlur = 4;
        this.weaponNameText.shadowOffsetX = 2;
        this.weaponNameText.shadowOffsetY = 2;

        this.weaponContainer.addControl(this.weaponNameText);

        // Ammo display
        this.weaponAmmoText = new TextBlock('weaponAmmo');
        this.weaponAmmoText.text = '30 / 30';
        this.weaponAmmoText.color = 'white';
        this.weaponAmmoText.fontSize = 32;
        this.weaponAmmoText.fontFamily = 'Courier New, monospace';
        this.weaponAmmoText.fontWeight = 'bold';
        this.weaponAmmoText.height = '40px';
        this.weaponAmmoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.weaponAmmoText.shadowColor = 'black';
        this.weaponAmmoText.shadowBlur = 4;
        this.weaponAmmoText.shadowOffsetX = 2;
        this.weaponAmmoText.shadowOffsetY = 2;

        this.weaponContainer.addControl(this.weaponAmmoText);
    }

    /**
     * Update health bar display.
     * @param {number} current - Current health
     * @param {number} max - Maximum health
     */
    updateHealth(current, max) {
        const percent = Math.max(0, current / max);
        const width = Math.floor(196 * percent);
        this.healthBarFill.width = `${width}px`;
        this.healthText.text = `${Math.max(0, Math.floor(current))}/${max}`;

        // Change color based on health level
        if (percent > 0.5) {
            this.healthBarFill.background = '#44ff44'; // Green
        } else if (percent > 0.25) {
            this.healthBarFill.background = '#ffaa44'; // Orange
        } else {
            this.healthBarFill.background = '#ff4444'; // Red
        }
    }

    /**
     * Update shield bar display.
     * @param {number} current - Current shield
     * @param {number} max - Maximum shield
     */
    updateShield(current, max) {
        const percent = Math.max(0, current / max);
        const width = Math.floor(196 * percent);
        this.shieldBarFill.width = `${width}px`;
        this.shieldText.text = `${Math.max(0, Math.floor(current))}/${max}`;
    }

    /**
     * Show damage flash effect.
     */
    showDamageFlash() {
        this.damageFlash.alpha = 1;

        // Fade out over 200ms
        const fadeSteps = 10;
        const fadeInterval = 20;
        let step = 0;

        const fade = setInterval(() => {
            step++;
            this.damageFlash.alpha = 1 - (step / fadeSteps);

            if (step >= fadeSteps) {
                clearInterval(fade);
                this.damageFlash.alpha = 0;
            }
        }, fadeInterval);
    }

    /**
     * Update wave number display.
     * @param {number} waveNumber
     */
    updateWave(waveNumber) {
        this.waveText.text = `Wave ${waveNumber}`;
    }

    /**
     * Update enemy count display.
     * @param {number} count
     */
    updateEnemyCount(count) {
        this.enemyCountText.text = `Enemies: ${count}`;
    }

    /**
     * Show a centered message that fades out.
     * @param {string} text - Message to display
     * @param {number} duration - Duration in ms before fade
     */
    showMessage(text, duration = 2000) {
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Show message
        this.messageText.text = text;
        this.messageText.alpha = 1;

        // Fade out after duration
        this.messageTimeout = setTimeout(() => {
            this.fadeOutMessage();
        }, duration);
    }

    /**
     * Fade out the message text.
     */
    fadeOutMessage() {
        const fadeSteps = 10;
        const fadeInterval = 50;
        let step = 0;

        const fade = setInterval(() => {
            step++;
            this.messageText.alpha = 1 - (step / fadeSteps);

            if (step >= fadeSteps) {
                clearInterval(fade);
                this.messageText.alpha = 0;
                this.messageText.text = '';
            }
        }, fadeInterval);
    }

    /**
     * Show buy phase indicator.
     * @param {number} seconds - Seconds remaining
     */
    showBuyPhaseIndicator(seconds) {
        this.buyPhaseText.text = `[B] BUY (${Math.ceil(seconds)}s)`;
        this.buyPhaseContainer.isVisible = true;
    }

    /**
     * Update buy phase indicator timer.
     * @param {number} seconds - Seconds remaining
     */
    updateBuyPhaseIndicator(seconds) {
        this.buyPhaseText.text = `[B] BUY (${Math.ceil(seconds)}s)`;
    }

    /**
     * Hide buy phase indicator.
     */
    hideBuyPhaseIndicator() {
        this.buyPhaseContainer.isVisible = false;
    }

    /**
     * Show buy phase timer (legacy - redirects to indicator).
     * @param {number} seconds - Seconds remaining
     */
    showBuyPhaseTimer(seconds) {
        this.showBuyPhaseIndicator(seconds);
    }

    /**
     * Hide buy phase timer (legacy - redirects to indicator).
     */
    hideBuyPhaseTimer() {
        this.hideBuyPhaseIndicator();
    }

    /**
     * Update score display.
     * @param {number} score
     */
    updateScore(score) {
        this.scoreText.text = `Score: ${score}`;
    }

    /**
     * Update credits display.
     * @param {number} credits
     */
    updateCredits(credits) {
        this.creditsText.text = `$ ${credits}`;
    }

    /**
     * Update weapon display.
     * @param {string} name - Weapon name
     * @param {string} ammoString - Ammo display string (e.g., "30 / 30" or "∞")
     */
    updateWeapon(name, ammoString) {
        this.weaponNameText.text = name;
        this.weaponAmmoText.text = ammoString;
    }

    /**
     * Create controls indicator (bottom center).
     */
    createControlsIndicator() {
        this.controlsText = new TextBlock('controlsText');
        this.controlsText.text = '[C] Controls: Arrow Keys';
        this.controlsText.color = '#888888';
        this.controlsText.fontSize = 14;
        this.controlsText.fontFamily = 'Courier New, monospace';
        this.controlsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.controlsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.controlsText.top = '-10px';
        this.controlsText.shadowColor = 'black';
        this.controlsText.shadowBlur = 2;
        this.controlsText.shadowOffsetX = 1;
        this.controlsText.shadowOffsetY = 1;

        this.gui.addControl(this.controlsText);
    }

    /**
     * Update control scheme display.
     * @param {string} scheme - 'arrows' or 'wasd'
     */
    updateControlScheme(scheme) {
        if (scheme === 'wasd') {
            this.controlsText.text = '[C] Controls: WASD';
        } else {
            this.controlsText.text = '[C] Controls: Arrow Keys';
        }
    }

    /**
     * Show floating point popup (e.g., "+100").
     * @param {number} amount - Points to display
     * @param {string} color - Color of text (optional)
     */
    showPointPopup(amount, color = '#ffff66') {
        const popup = new TextBlock(`popup_${Date.now()}`);
        popup.text = `+${amount}`;
        popup.color = color;
        popup.fontSize = 28;
        popup.fontFamily = 'Courier New, monospace';
        popup.fontWeight = 'bold';
        popup.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.shadowColor = 'black';
        popup.shadowBlur = 4;
        popup.shadowOffsetX = 2;
        popup.shadowOffsetY = 2;

        // Random horizontal offset for variety
        const offsetX = (Math.random() - 0.5) * 100;
        popup.left = `${offsetX}px`;
        popup.top = '0px';

        this.gui.addControl(popup);
        this.activePopups.push(popup);

        // Animate: float up and fade out
        let elapsed = 0;
        const duration = 1000; // 1 second
        const moveDistance = 80; // pixels to move up

        const animate = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / duration;

            // Move up
            popup.top = `${-progress * moveDistance}px`;

            // Fade out in second half
            if (progress > 0.5) {
                popup.alpha = 1 - ((progress - 0.5) * 2);
            }

            // Remove when done
            if (progress >= 1) {
                clearInterval(animate);
                this.gui.removeControl(popup);
                const index = this.activePopups.indexOf(popup);
                if (index > -1) {
                    this.activePopups.splice(index, 1);
                }
            }
        }, 16);
    }

    /**
     * Dispose of HUD resources.
     */
    dispose() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        // Clean up any active popups
        for (const popup of this.activePopups) {
            this.gui.removeControl(popup);
        }
        this.activePopups = [];
        this.gui.dispose();
    }
}
