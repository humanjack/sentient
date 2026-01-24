/**
 * TutorialHints.js - Shows control hints on first play.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class TutorialHints {
    static STORAGE_KEY = 'enemyEyes_tutorialShown';

    /**
     * Create tutorial hints UI.
     * @param {Scene} scene - Babylon.js scene
     */
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.hasInteracted = false;

        // Check if already shown before
        if (this.hasBeenShown()) {
            console.log('Tutorial already shown, skipping');
            return;
        }

        // Create fullscreen GUI
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('TutorialUI', true, scene);

        // Create elements
        this.createHints();

        // Show hints
        this.show();

        // Setup auto-dismiss
        this.setupAutoDismiss();

        console.log('TutorialHints initialized');
    }

    /**
     * Check if tutorial has been shown before.
     * @returns {boolean}
     */
    hasBeenShown() {
        return localStorage.getItem(TutorialHints.STORAGE_KEY) === 'true';
    }

    /**
     * Mark tutorial as shown.
     */
    markAsShown() {
        localStorage.setItem(TutorialHints.STORAGE_KEY, 'true');
    }

    /**
     * Create hint elements.
     */
    createHints() {
        // Semi-transparent background
        this.background = new Rectangle('tutorialBackground');
        this.background.width = '100%';
        this.background.height = '100%';
        this.background.background = 'rgba(0, 0, 0, 0.5)';
        this.background.thickness = 0;
        this.background.isVisible = false;

        this.gui.addControl(this.background);

        // Hints container
        this.container = new Rectangle('tutorialContainer');
        this.container.width = '400px';
        this.container.height = '380px';
        this.container.background = 'rgba(20, 30, 50, 0.95)';
        this.container.thickness = 3;
        this.container.color = '#44aaff';
        this.container.cornerRadius = 15;
        this.container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.container.isVisible = false;

        this.gui.addControl(this.container);

        // Stack panel for hints
        const stack = new StackPanel('hintsStack');
        stack.width = '100%';
        stack.paddingTop = '20px';

        this.container.addControl(stack);

        // Title
        const title = new TextBlock('tutorialTitle');
        title.text = 'CONTROLS';
        title.color = '#66ffff';
        title.fontSize = 32;
        title.fontFamily = 'Courier New, monospace';
        title.fontWeight = 'bold';
        title.height = '50px';
        title.shadowColor = 'black';
        title.shadowBlur = 4;

        stack.addControl(title);

        // Control hints
        const hints = [
            { key: 'Arrow Keys / WASD', action: 'Move' },
            { key: 'SPACE', action: 'Shoot' },
            { key: 'R', action: 'Reload' },
            { key: 'SHIFT', action: 'Sprint' },
            { key: '1-4', action: 'Switch Weapons' },
            { key: 'Q E C X', action: 'Abilities' },
            { key: 'B', action: 'Buy Menu (between waves)' },
            { key: 'ESC', action: 'Pause' },
        ];

        for (const hint of hints) {
            const row = new TextBlock(`hint_${hint.key}`);
            row.text = `${hint.key}  -  ${hint.action}`;
            row.color = '#aaccff';
            row.fontSize = 18;
            row.fontFamily = 'Courier New, monospace';
            row.height = '30px';

            stack.addControl(row);
        }

        // Dismiss instruction
        const dismiss = new TextBlock('dismissText');
        dismiss.text = 'Press any key to continue...';
        dismiss.color = '#888888';
        dismiss.fontSize = 14;
        dismiss.fontFamily = 'Courier New, monospace';
        dismiss.height = '40px';
        dismiss.paddingTop = '20px';

        stack.addControl(dismiss);
    }

    /**
     * Setup auto-dismiss after 10 seconds or on input.
     */
    setupAutoDismiss() {
        // Auto-hide after 10 seconds
        this.dismissTimeout = setTimeout(() => {
            this.hide();
        }, 10000);

        // Hide on any key press
        this.keyHandler = () => {
            if (!this.hasInteracted) {
                this.hasInteracted = true;
                this.hide();
            }
        };

        document.addEventListener('keydown', this.keyHandler);
        document.addEventListener('click', this.keyHandler);
    }

    /**
     * Show the tutorial hints.
     */
    show() {
        if (!this.container) return;

        this.background.isVisible = true;
        this.container.isVisible = true;
        this.isVisible = true;
    }

    /**
     * Hide the tutorial hints.
     */
    hide() {
        if (!this.container) return;

        this.background.isVisible = false;
        this.container.isVisible = false;
        this.isVisible = false;

        // Mark as shown
        this.markAsShown();

        // Clear timeout
        if (this.dismissTimeout) {
            clearTimeout(this.dismissTimeout);
        }

        // Remove event listeners
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            document.removeEventListener('click', this.keyHandler);
        }
    }

    /**
     * Check if hints are visible.
     * @returns {boolean}
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * Reset tutorial (for debugging).
     */
    static reset() {
        localStorage.removeItem(TutorialHints.STORAGE_KEY);
        console.log('Tutorial reset - will show on next game start');
    }

    /**
     * Dispose of UI resources.
     */
    dispose() {
        if (this.dismissTimeout) {
            clearTimeout(this.dismissTimeout);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            document.removeEventListener('click', this.keyHandler);
        }
        if (this.gui) {
            this.gui.dispose();
        }
    }
}
