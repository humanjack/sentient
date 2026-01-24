/**
 * GameOverUI.js - Game over screen with stats and restart button.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class GameOverUI {
    /**
     * Create game over UI.
     * @param {Scene} scene - Babylon.js scene
     * @param {function} onRestart - Called when restart button clicked
     */
    constructor(scene, onRestart) {
        this.scene = scene;
        this.onRestart = onRestart;
        this.isVisible = false;

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

        // Restart button
        this.restartButton = Button.CreateSimpleButton('restartBtn', 'RESTART');
        this.restartButton.width = '200px';
        this.restartButton.height = '60px';
        this.restartButton.color = 'white';
        this.restartButton.background = '#44aa44';
        this.restartButton.fontSize = 28;
        this.restartButton.fontFamily = 'Courier New, monospace';
        this.restartButton.paddingTop = '30px';
        this.restartButton.cornerRadius = 10;
        this.restartButton.thickness = 2;

        // Hover effects
        this.restartButton.onPointerEnterObservable.add(() => {
            this.restartButton.background = '#66cc66';
        });
        this.restartButton.onPointerOutObservable.add(() => {
            this.restartButton.background = '#44aa44';
        });

        // Click handler
        this.restartButton.onPointerUpObservable.add(() => {
            if (this.onRestart) {
                this.onRestart();
            }
        });

        this.panel.addControl(this.restartButton);
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
