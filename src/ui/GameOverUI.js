/**
 * GameOverUI.js - Game over screen with stats and restart button.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { SaveManager } from '../gameflow/SaveManager.js';

export class GameOverUI {
    /**
     * Create game over UI.
     * @param {Scene} scene - Babylon.js scene
     * @param {Object} callbacks - Menu action callbacks
     */
    constructor(scene, callbacks = {}) {
        this.scene = scene;
        this.onRestart = callbacks.onRestart || null;
        this.onMainMenu = callbacks.onMainMenu || null;
        this.isVisible = false;

        // Get save manager
        this.saveManager = SaveManager.getInstance();

        // Create fullscreen GUI
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('GameOverUI', true, scene);

        // Create all elements
        this.createOverlay();
        this.createPanel();

        // Hide by default
        this.hide();

        console.log('GameOverUI initialized');
    }

    /**
     * Create semi-transparent dark overlay.
     */
    createOverlay() {
        this.overlay = new Rectangle('overlay');
        this.overlay.width = '100%';
        this.overlay.height = '100%';
        this.overlay.background = 'rgba(0, 0, 0, 0.8)';
        this.overlay.thickness = 0;

        this.gui.addControl(this.overlay);
    }

    /**
     * Create the main panel with text and button.
     */
    createPanel() {
        // Container panel
        this.panel = new StackPanel('gameOverPanel');
        this.panel.width = '400px';
        this.panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        this.gui.addControl(this.panel);

        // "GAME OVER" title
        this.titleText = new TextBlock('gameOverTitle');
        this.titleText.text = 'GAME OVER';
        this.titleText.color = '#ff4444';
        this.titleText.fontSize = 64;
        this.titleText.fontFamily = 'Courier New, monospace';
        this.titleText.fontWeight = 'bold';
        this.titleText.height = '80px';
        this.titleText.shadowColor = 'black';
        this.titleText.shadowBlur = 8;
        this.titleText.shadowOffsetX = 4;
        this.titleText.shadowOffsetY = 4;

        this.panel.addControl(this.titleText);

        // Wave reached
        this.waveText = new TextBlock('waveReached');
        this.waveText.text = 'Wave Reached: 1';
        this.waveText.color = '#66ffff';
        this.waveText.fontSize = 32;
        this.waveText.fontFamily = 'Courier New, monospace';
        this.waveText.height = '50px';
        this.waveText.paddingTop = '20px';

        this.panel.addControl(this.waveText);

        // Total kills
        this.killsText = new TextBlock('totalKills');
        this.killsText.text = 'Total Kills: 0';
        this.killsText.color = '#ff6666';
        this.killsText.fontSize = 32;
        this.killsText.fontFamily = 'Courier New, monospace';
        this.killsText.height = '50px';

        this.panel.addControl(this.killsText);

        // Score
        this.scoreText = new TextBlock('finalScore');
        this.scoreText.text = 'Score: 0';
        this.scoreText.color = '#ffff66';
        this.scoreText.fontSize = 32;
        this.scoreText.fontFamily = 'Courier New, monospace';
        this.scoreText.height = '50px';

        this.panel.addControl(this.scoreText);

        // New high score text (hidden by default)
        this.newHighScoreText = new TextBlock('newHighScore');
        this.newHighScoreText.text = 'NEW HIGH SCORE!';
        this.newHighScoreText.color = '#ffaa00';
        this.newHighScoreText.fontSize = 28;
        this.newHighScoreText.fontFamily = 'Courier New, monospace';
        this.newHighScoreText.fontWeight = 'bold';
        this.newHighScoreText.height = '40px';
        this.newHighScoreText.paddingTop = '10px';
        this.newHighScoreText.isVisible = false;

        this.panel.addControl(this.newHighScoreText);

        // Button container for side by side layout
        const buttonRow = new StackPanel('buttonRow');
        buttonRow.isVertical = false;
        buttonRow.width = '100%';
        buttonRow.height = '80px';
        buttonRow.paddingTop = '20px';
        buttonRow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

        this.panel.addControl(buttonRow);

        // Restart button
        this.restartButton = this.createButton('RESTART', '#44aa44', () => {
            if (this.onRestart) this.onRestart();
        });
        buttonRow.addControl(this.restartButton);

        // Main Menu button
        this.mainMenuButton = this.createButton('MAIN MENU', '#4466aa', () => {
            if (this.onMainMenu) this.onMainMenu();
        });
        buttonRow.addControl(this.mainMenuButton);
    }

    /**
     * Create a styled button.
     * @param {string} text
     * @param {string} color
     * @param {function} onClick
     * @returns {Rectangle}
     */
    createButton(text, color, onClick) {
        const container = new Rectangle(`btn_${text}_container`);
        container.width = '150px';
        container.height = '50px';
        container.thickness = 0;
        container.paddingLeft = '10px';
        container.paddingRight = '10px';

        const button = Button.CreateSimpleButton(`btn_${text}`, text);
        button.width = '100%';
        button.height = '100%';
        button.color = 'white';
        button.background = color;
        button.fontSize = 18;
        button.fontFamily = 'Courier New, monospace';
        button.fontWeight = 'bold';
        button.cornerRadius = 10;
        button.thickness = 2;

        container.addControl(button);

        // Hover effects
        const lighterColor = this.lightenColor(color);
        button.onPointerEnterObservable.add(() => {
            button.background = lighterColor;
        });
        button.onPointerOutObservable.add(() => {
            button.background = color;
        });

        button.onPointerUpObservable.add(onClick);

        return container;
    }

    /**
     * Lighten a hex color.
     * @param {string} color
     * @returns {string}
     */
    lightenColor(color) {
        if (color === '#44aa44') return '#66cc66';
        if (color === '#4466aa') return '#6688cc';
        return color;
    }

    /**
     * Show the game over screen with stats.
     * @param {number} wave - Wave reached
     * @param {number} kills - Total kills
     * @param {number} score - Final score
     */
    show(wave, kills, score) {
        this.waveText.text = `Wave Reached: ${wave}`;
        this.killsText.text = `Total Kills: ${kills}`;
        this.scoreText.text = `Score: ${score}`;

        // Save and check for new high score
        const isNewHigh = this.saveManager.saveHighScore(score, wave);
        this.saveManager.addKills(kills);
        this.newHighScoreText.isVisible = isNewHigh;

        this.overlay.isVisible = true;
        this.panel.isVisible = true;
        this.isVisible = true;
    }

    /**
     * Hide the game over screen.
     */
    hide() {
        this.overlay.isVisible = false;
        this.panel.isVisible = false;
        this.isVisible = false;
    }

    /**
     * Dispose of UI resources.
     */
    dispose() {
        this.gui.dispose();
    }
}
