/**
 * BuyMenuUI.js - Buy phase menu using Babylon.js GUI.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Settings } from '../core/Settings.js';
import { AudioManager } from '../audio/AudioManager.js';

export class BuyMenuUI {
    /**
     * Create buy menu UI.
     * @param {Scene} scene - Babylon.js scene
     * @param {function} onPurchase - Called when item purchased (itemId)
     * @param {function} onSkip - Called when skip/ready clicked
     */
    constructor(scene, onPurchase, onSkip) {
        this.scene = scene;
        this.onPurchase = onPurchase;
        this.onSkip = onSkip;
        this.isVisible = false;
        this.currentCredits = 0;

        // Item definitions
        this.items = [
            { id: 'ammo', name: 'Ammo Refill', cost: 200, description: 'Refill all ammo' },
            { id: 'health', name: 'Health Pack', cost: 400, description: '+50 Health' },
            { id: 'shield', name: 'Shield Recharge', cost: 300, description: '+50 Shield' },
            { id: 'shotgun', name: 'Shotgun', cost: 800, description: '6 pellets, high damage', isWeapon: true },
            { id: 'smg', name: 'SMG', cost: 1200, description: 'Fast fire rate', isWeapon: true },
        ];

        // Track owned weapons for button state
        this.ownedWeapons = new Set();

        // Store button references for updating
        this.itemButtons = {};

        // Create fullscreen GUI
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('BuyMenuUI', true, scene);

        // Create all elements
        this.createOverlay();
        this.createPanel();

        // Hide by default
        this.hide();

        console.log('BuyMenuUI initialized');
    }

    /**
     * Create semi-transparent dark overlay.
     */
    createOverlay() {
        this.overlay = new Rectangle('buyOverlay');
        this.overlay.width = '100%';
        this.overlay.height = '100%';
        this.overlay.background = 'rgba(0, 0, 0, 0.7)';
        this.overlay.thickness = 0;

        this.gui.addControl(this.overlay);
    }

    /**
     * Create the main panel with items.
     */
    createPanel() {
        // Main container
        this.panel = new Rectangle('buyPanel');
        this.panel.width = '400px';
        this.panel.height = '720px';
        this.panel.background = 'rgba(20, 30, 40, 0.95)';
        this.panel.thickness = 3;
        this.panel.color = '#44aaff';
        this.panel.cornerRadius = 15;
        this.panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        this.gui.addControl(this.panel);

        // Stack panel for content
        this.contentStack = new StackPanel('buyContent');
        this.contentStack.width = '100%';
        this.contentStack.paddingTop = '20px';
        this.contentStack.paddingBottom = '20px';

        this.panel.addControl(this.contentStack);

        // Title
        this.titleText = new TextBlock('buyTitle');
        this.titleText.text = 'BUY PHASE';
        this.titleText.color = '#44aaff';
        this.titleText.fontSize = 36;
        this.titleText.fontFamily = 'Courier New, monospace';
        this.titleText.fontWeight = 'bold';
        this.titleText.height = '50px';
        this.titleText.shadowColor = 'black';
        this.titleText.shadowBlur = 4;

        this.contentStack.addControl(this.titleText);

        // Credits display
        this.creditsText = new TextBlock('buyCredits');
        this.creditsText.text = '$ 0';
        this.creditsText.color = '#66ff66';
        this.creditsText.fontSize = 28;
        this.creditsText.fontFamily = 'Courier New, monospace';
        this.creditsText.height = '40px';
        this.creditsText.paddingTop = '5px';

        this.contentStack.addControl(this.creditsText);

        // Timer display
        this.timerText = new TextBlock('buyTimer');
        this.timerText.text = 'Next wave in: 15';
        this.timerText.color = '#ffaa44';
        this.timerText.fontSize = 20;
        this.timerText.fontFamily = 'Courier New, monospace';
        this.timerText.height = '35px';
        this.timerText.paddingBottom = '15px';

        this.contentStack.addControl(this.timerText);

        // Create item buttons
        for (const item of this.items) {
            this.createItemButton(item);
        }

        // Skip/Ready button
        this.createSkipButton();

        // Controls toggle button
        this.createControlsButton();

        // Escape hint
        this.createEscapeHint();
    }

    /**
     * Create a button for a buyable item.
     * @param {Object} item
     */
    createItemButton(item) {
        const buttonContainer = new Rectangle(`btn_${item.id}_container`);
        buttonContainer.width = '350px';
        buttonContainer.height = '70px';
        buttonContainer.thickness = 0;
        buttonContainer.paddingTop = '8px';

        this.contentStack.addControl(buttonContainer);

        const button = Button.CreateSimpleButton(`btn_${item.id}`, '');
        button.width = '100%';
        button.height = '100%';
        button.background = '#2a3a4a';
        button.thickness = 2;
        button.color = '#44aaff';
        button.cornerRadius = 8;

        buttonContainer.addControl(button);

        // Item name and cost text
        const nameText = new TextBlock(`${item.id}_name`);
        nameText.text = `${item.name} - $${item.cost}`;
        nameText.color = 'white';
        nameText.fontSize = 22;
        nameText.fontFamily = 'Courier New, monospace';
        nameText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        nameText.top = '10px';

        button.addControl(nameText);

        // Description text
        const descText = new TextBlock(`${item.id}_desc`);
        descText.text = item.description;
        descText.color = '#aaaaaa';
        descText.fontSize = 16;
        descText.fontFamily = 'Courier New, monospace';
        descText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        descText.top = '-10px';

        button.addControl(descText);

        // Store reference for updating
        this.itemButtons[item.id] = {
            button,
            nameText,
            descText,
            item,
            container: buttonContainer,
        };

        // Hover effects
        button.onPointerEnterObservable.add(() => {
            if (this.canAfford(item.cost)) {
                button.background = '#3a5a7a';
            }
        });

        button.onPointerOutObservable.add(() => {
            this.updateButtonState(item.id);
        });

        // Click handler
        button.onPointerUpObservable.add(() => {
            // Check if weapon already owned
            if (item.isWeapon && this.ownedWeapons.has(item.id)) {
                return; // Already owned
            }

            if (this.canAfford(item.cost)) {
                this.handlePurchase(item.id);
            } else {
                this.playFailSound();
                this.flashButton(item.id, '#ff4444'); // Red flash for can't afford
            }
        });
    }

    /**
     * Create skip/ready button.
     */
    createSkipButton() {
        const buttonContainer = new Rectangle('skipContainer');
        buttonContainer.width = '350px';
        buttonContainer.height = '55px';
        buttonContainer.thickness = 0;
        buttonContainer.paddingTop = '20px';

        this.contentStack.addControl(buttonContainer);

        this.skipButton = Button.CreateSimpleButton('skipBtn', 'START NEXT WAVE');
        this.skipButton.width = '100%';
        this.skipButton.height = '100%';
        this.skipButton.color = 'white';
        this.skipButton.background = '#44aa44';
        this.skipButton.fontSize = 20;
        this.skipButton.fontFamily = 'Courier New, monospace';
        this.skipButton.cornerRadius = 8;
        this.skipButton.thickness = 2;

        buttonContainer.addControl(this.skipButton);

        // Hover effects
        this.skipButton.onPointerEnterObservable.add(() => {
            this.skipButton.background = '#66cc66';
        });

        this.skipButton.onPointerOutObservable.add(() => {
            this.skipButton.background = '#44aa44';
        });

        // Click handler
        this.skipButton.onPointerUpObservable.add(() => {
            if (this.onSkip) {
                this.onSkip();
            }
        });
    }

    /**
     * Create controls toggle button.
     */
    createControlsButton() {
        const buttonContainer = new Rectangle('controlsContainer');
        buttonContainer.width = '350px';
        buttonContainer.height = '45px';
        buttonContainer.thickness = 0;
        buttonContainer.paddingTop = '10px';

        this.contentStack.addControl(buttonContainer);

        // Get current control scheme
        const settings = Settings.getInstance();
        const scheme = settings.getControlScheme();
        const buttonText = scheme === 'wasd' ? 'Controls: WASD' : 'Controls: Arrow Keys';

        this.controlsButton = Button.CreateSimpleButton('controlsBtn', buttonText);
        this.controlsButton.width = '100%';
        this.controlsButton.height = '100%';
        this.controlsButton.color = 'white';
        this.controlsButton.background = '#4a4a6a';
        this.controlsButton.fontSize = 18;
        this.controlsButton.fontFamily = 'Courier New, monospace';
        this.controlsButton.cornerRadius = 8;
        this.controlsButton.thickness = 2;

        buttonContainer.addControl(this.controlsButton);

        // Hover effects
        this.controlsButton.onPointerEnterObservable.add(() => {
            this.controlsButton.background = '#6a6a8a';
        });

        this.controlsButton.onPointerOutObservable.add(() => {
            this.controlsButton.background = '#4a4a6a';
        });

        // Click handler - toggle control scheme
        this.controlsButton.onPointerUpObservable.add(() => {
            const newScheme = settings.toggleControlScheme();
            this.controlsButton.textBlock.text = newScheme === 'wasd' ? 'Controls: WASD' : 'Controls: Arrow Keys';

            // Notify callback if set
            if (this.onControlsChanged) {
                this.onControlsChanged(newScheme);
            }
        });
    }

    /**
     * Create escape hint text.
     */
    createEscapeHint() {
        const hintText = new TextBlock('escHint');
        hintText.text = 'Press ESC to close';
        hintText.color = '#666666';
        hintText.fontSize = 14;
        hintText.fontFamily = 'Courier New, monospace';
        hintText.height = '25px';
        hintText.paddingTop = '10px';

        this.contentStack.addControl(hintText);
    }

    /**
     * Set callback for when controls are changed.
     * @param {function} callback
     */
    setOnControlsChanged(callback) {
        this.onControlsChanged = callback;
    }

    /**
     * Update controls button text based on current setting.
     */
    updateControlsButton() {
        if (this.controlsButton) {
            const settings = Settings.getInstance();
            const scheme = settings.getControlScheme();
            this.controlsButton.textBlock.text = scheme === 'wasd' ? 'Controls: WASD' : 'Controls: Arrow Keys';
        }
    }

    /**
     * Check if can afford an item.
     * @param {number} cost
     * @returns {boolean}
     */
    canAfford(cost) {
        return this.currentCredits >= cost;
    }

    /**
     * Handle item purchase.
     * @param {string} itemId
     */
    handlePurchase(itemId) {
        const btnData = this.itemButtons[itemId];
        if (!btnData) return;

        // Play purchase sound
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSound('purchase');
        }

        // Flash green for success
        this.flashButton(itemId, '#44ff44');

        // Notify callback
        if (this.onPurchase) {
            this.onPurchase(itemId);
        }
    }

    /**
     * Play fail sound for can't afford.
     */
    playFailSound() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSound('purchase_fail');
        }
    }

    /**
     * Flash a button with a color.
     * @param {string} itemId
     * @param {string} color
     */
    flashButton(itemId, color) {
        const btnData = this.itemButtons[itemId];
        if (!btnData) return;

        const originalBg = btnData.button.background;
        btnData.button.background = color;

        setTimeout(() => {
            this.updateButtonState(itemId);
        }, 200);
    }

    /**
     * Update a button's visual state based on affordability and ownership.
     * @param {string} itemId
     */
    updateButtonState(itemId) {
        const btnData = this.itemButtons[itemId];
        if (!btnData) return;

        const item = btnData.item;

        // Check if it's a weapon that's already owned
        if (item.isWeapon && this.ownedWeapons.has(itemId)) {
            btnData.button.background = '#1a3a1a';
            btnData.button.color = '#44aa44';
            btnData.nameText.color = '#44aa44';
            btnData.nameText.text = `${item.name} - OWNED`;
            btnData.descText.color = '#44aa44';
            return;
        }

        // Reset name text if not owned
        if (item.isWeapon) {
            btnData.nameText.text = `${item.name} - $${item.cost}`;
        }

        const canAfford = this.canAfford(item.cost);

        if (canAfford) {
            btnData.button.background = '#2a3a4a';
            btnData.button.color = '#44aaff';
            btnData.nameText.color = 'white';
            btnData.descText.color = '#aaaaaa';
        } else {
            btnData.button.background = '#1a1a1a';
            btnData.button.color = '#444444';
            btnData.nameText.color = '#666666';
            btnData.descText.color = '#444444';
        }
    }

    /**
     * Set which weapons are owned.
     * @param {Set} ownedSet - Set of owned weapon IDs
     */
    setOwnedWeapons(ownedSet) {
        this.ownedWeapons = ownedSet;
        this.updateAllButtonStates();
    }

    /**
     * Update all button states.
     */
    updateAllButtonStates() {
        for (const itemId of Object.keys(this.itemButtons)) {
            this.updateButtonState(itemId);
        }
    }

    /**
     * Update credits display.
     * @param {number} credits
     */
    updateCredits(credits) {
        this.currentCredits = credits;
        this.creditsText.text = `$ ${credits}`;
        this.updateAllButtonStates();
    }

    /**
     * Update timer display.
     * @param {number} seconds
     */
    updateTimer(seconds) {
        this.timerText.text = `Next wave in: ${Math.ceil(seconds)}`;
    }

    /**
     * Show the buy menu.
     */
    show() {
        this.overlay.isVisible = true;
        this.panel.isVisible = true;
        this.isVisible = true;

        // Update controls button to reflect current setting
        this.updateControlsButton();
    }

    /**
     * Hide the buy menu.
     */
    hide() {
        this.overlay.isVisible = false;
        this.panel.isVisible = false;
        this.isVisible = false;
    }

    /**
     * Toggle visibility.
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Dispose of UI resources.
     */
    dispose() {
        this.gui.dispose();
    }
}
