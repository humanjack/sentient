/**
 * PauseMenuUI.js - Pause menu using Babylon.js GUI.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class PauseMenuUI {
    /**
     * Create pause menu UI.
     * @param {Scene} scene - Babylon.js scene
     * @param {Object} callbacks - Menu action callbacks
     */
    constructor(scene, callbacks = {}) {
        this.scene = scene;
        this.onResume = callbacks.onResume || null;
        this.onRestart = callbacks.onRestart || null;
        this.onMainMenu = callbacks.onMainMenu || null;
        this.isVisible = false;

        // Create fullscreen GUI
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('PauseMenuUI', true, scene);

        // Create elements
        this.createBackground();
        this.createPanel();

        // Hide by default
        this.hide();

        console.log('PauseMenuUI initialized');
    }

    /**
     * Create semi-transparent overlay.
     */
    createBackground() {
        this.background = new Rectangle('pauseBackground');
        this.background.width = '100%';
        this.background.height = '100%';
        this.background.background = 'rgba(0, 0, 0, 0.7)';
        this.background.thickness = 0;

        this.gui.addControl(this.background);
    }

    /**
     * Create the pause menu panel.
     */
    createPanel() {
        // Main panel
        this.panel = new Rectangle('pausePanel');
        this.panel.width = '350px';
        this.panel.height = '400px';
        this.panel.background = 'rgba(30, 40, 60, 0.95)';
        this.panel.thickness = 3;
        this.panel.color = '#888888';
        this.panel.cornerRadius = 15;

        this.gui.addControl(this.panel);

        // Content stack
        const stack = new StackPanel('pauseStack');
        stack.width = '100%';
        stack.paddingTop = '30px';

        this.panel.addControl(stack);

        // Title
        const title = new TextBlock('pauseTitle');
        title.text = 'PAUSED';
        title.color = '#cccccc';
        title.fontSize = 42;
        title.fontFamily = 'Courier New, monospace';
        title.fontWeight = 'bold';
        title.height = '60px';

        stack.addControl(title);

        // Buttons
        this.createMenuButton(stack, 'Resume', '#44aa44', () => {
            if (this.onResume) this.onResume();
        });

        this.createMenuButton(stack, 'Restart', '#aa8844', () => {
            if (this.onRestart) this.onRestart();
        });

        this.createMenuButton(stack, 'Main Menu', '#4466aa', () => {
            if (this.onMainMenu) this.onMainMenu();
        });

        // Hint text
        const hint = new TextBlock('pauseHint');
        hint.text = 'Press ESC to resume';
        hint.color = '#666666';
        hint.fontSize = 14;
        hint.fontFamily = 'Courier New, monospace';
        hint.height = '40px';
        hint.paddingTop = '20px';

        stack.addControl(hint);
    }

    /**
     * Create a menu button.
     * @param {StackPanel} parent
     * @param {string} text
     * @param {string} color
     * @param {function} onClick
     */
    createMenuButton(parent, text, color, onClick) {
        const buttonContainer = new Rectangle(`btn_${text}_container`);
        buttonContainer.width = '280px';
        buttonContainer.height = '60px';
        buttonContainer.thickness = 0;
        buttonContainer.paddingTop = '15px';

        parent.addControl(buttonContainer);

        const button = Button.CreateSimpleButton(`btn_${text}`, text);
        button.width = '100%';
        button.height = '100%';
        button.color = 'white';
        button.background = color;
        button.fontSize = 22;
        button.fontFamily = 'Courier New, monospace';
        button.fontWeight = 'bold';
        button.cornerRadius = 10;
        button.thickness = 2;

        buttonContainer.addControl(button);

        // Hover effects
        const originalColor = color;
        button.onPointerEnterObservable.add(() => {
            button.background = this.lightenColor(originalColor);
        });

        button.onPointerOutObservable.add(() => {
            button.background = originalColor;
        });

        // Click handler
        button.onPointerUpObservable.add(onClick);
    }

    /**
     * Lighten a hex color.
     * @param {string} color
     * @returns {string}
     */
    lightenColor(color) {
        // Simple lightening
        if (color === '#44aa44') return '#66cc66';
        if (color === '#aa8844') return '#ccaa66';
        if (color === '#4466aa') return '#6688cc';
        return color;
    }

    /**
     * Show the pause menu.
     */
    show() {
        this.background.isVisible = true;
        this.panel.isVisible = true;
        this.isVisible = true;
    }

    /**
     * Hide the pause menu.
     */
    hide() {
        this.background.isVisible = false;
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
     * Check if paused.
     * @returns {boolean}
     */
    isPaused() {
        return this.isVisible;
    }

    /**
     * Dispose of UI resources.
     */
    dispose() {
        this.gui.dispose();
    }
}
