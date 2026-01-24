/**
 * MainMenuUI.js - Main menu screen using Babylon.js GUI.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { SaveManager } from '../gameflow/SaveManager.js';

export class MainMenuUI {
    /**
     * Create main menu UI.
     * @param {Scene} scene - Babylon.js scene
     * @param {function} onPlay - Called when Play is clicked
     */
    constructor(scene, onPlay) {
        this.scene = scene;
        this.onPlay = onPlay;
        this.isVisible = true;

        // Get save manager
        this.saveManager = SaveManager.getInstance();

        // Create fullscreen GUI
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('MainMenuUI', true, scene);

        // Create elements
        this.createBackground();
        this.createPanel();

        console.log('MainMenuUI initialized');
    }

    /**
     * Create dark background overlay.
     */
    createBackground() {
        this.background = new Rectangle('menuBackground');
        this.background.width = '100%';
        this.background.height = '100%';
        this.background.background = 'rgba(10, 15, 25, 0.95)';
        this.background.thickness = 0;

        this.gui.addControl(this.background);
    }

    /**
     * Create the main menu panel.
     */
    createPanel() {
        // Main panel
        this.panel = new Rectangle('menuPanel');
        this.panel.width = '450px';
        this.panel.height = '600px';
        this.panel.background = 'rgba(20, 30, 50, 0.9)';
        this.panel.thickness = 3;
        this.panel.color = '#44aaff';
        this.panel.cornerRadius = 20;

        this.gui.addControl(this.panel);

        // Content stack
        const stack = new StackPanel('menuStack');
        stack.width = '100%';
        stack.paddingTop = '30px';

        this.panel.addControl(stack);

        // Game title
        const title = new TextBlock('title');
        title.text = 'ENEMY EYES';
        title.color = '#ff6644';
        title.fontSize = 48;
        title.fontFamily = 'Courier New, monospace';
        title.fontWeight = 'bold';
        title.height = '70px';
        title.shadowColor = 'black';
        title.shadowBlur = 8;
        title.shadowOffsetX = 4;
        title.shadowOffsetY = 4;

        stack.addControl(title);

        // Subtitle
        const subtitle = new TextBlock('subtitle');
        subtitle.text = 'Wave Survival Shooter';
        subtitle.color = '#88aacc';
        subtitle.fontSize = 20;
        subtitle.fontFamily = 'Courier New, monospace';
        subtitle.height = '35px';

        stack.addControl(subtitle);

        // Unique mechanic description
        const mechanic = new TextBlock('mechanic');
        mechanic.text = '"See through enemy eyes"';
        mechanic.color = '#ffaa44';
        mechanic.fontSize = 16;
        mechanic.fontFamily = 'Courier New, monospace';
        mechanic.fontStyle = 'italic';
        mechanic.height = '40px';

        stack.addControl(mechanic);

        // High score display
        this.createHighScoreDisplay(stack);

        // Play button
        this.createPlayButton(stack);

        // Controls hint
        this.createControlsHint(stack);
    }

    /**
     * Create high score display.
     * @param {StackPanel} parent
     */
    createHighScoreDisplay(parent) {
        const highScoreData = this.saveManager.loadHighScore();

        // Container
        const container = new Rectangle('highScoreContainer');
        container.width = '350px';
        container.height = '100px';
        container.background = 'rgba(0, 50, 100, 0.3)';
        container.thickness = 2;
        container.color = '#446688';
        container.cornerRadius = 10;
        container.paddingTop = '30px';

        parent.addControl(container);

        // High score text
        this.highScoreText = new TextBlock('highScore');
        this.highScoreText.text = `HIGH SCORE: ${highScoreData.score}`;
        this.highScoreText.color = '#ffff66';
        this.highScoreText.fontSize = 24;
        this.highScoreText.fontFamily = 'Courier New, monospace';
        this.highScoreText.fontWeight = 'bold';
        this.highScoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.highScoreText.top = '15px';

        container.addControl(this.highScoreText);

        // High wave text
        this.highWaveText = new TextBlock('highWave');
        this.highWaveText.text = `HIGHEST WAVE: ${highScoreData.wave}`;
        this.highWaveText.color = '#66ffff';
        this.highWaveText.fontSize = 20;
        this.highWaveText.fontFamily = 'Courier New, monospace';
        this.highWaveText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.highWaveText.top = '-15px';

        container.addControl(this.highWaveText);
    }

    /**
     * Create play button.
     * @param {StackPanel} parent
     */
    createPlayButton(parent) {
        const buttonContainer = new Rectangle('playBtnContainer');
        buttonContainer.width = '300px';
        buttonContainer.height = '80px';
        buttonContainer.thickness = 0;
        buttonContainer.paddingTop = '30px';

        parent.addControl(buttonContainer);

        const playButton = Button.CreateSimpleButton('playBtn', 'PLAY');
        playButton.width = '100%';
        playButton.height = '100%';
        playButton.color = 'white';
        playButton.background = '#44aa44';
        playButton.fontSize = 32;
        playButton.fontFamily = 'Courier New, monospace';
        playButton.fontWeight = 'bold';
        playButton.cornerRadius = 15;
        playButton.thickness = 3;

        buttonContainer.addControl(playButton);

        // Hover effects
        playButton.onPointerEnterObservable.add(() => {
            playButton.background = '#66cc66';
            playButton.scaleX = 1.05;
            playButton.scaleY = 1.05;
        });

        playButton.onPointerOutObservable.add(() => {
            playButton.background = '#44aa44';
            playButton.scaleX = 1;
            playButton.scaleY = 1;
        });

        // Click handler
        playButton.onPointerUpObservable.add(() => {
            if (this.onPlay) {
                this.onPlay();
            }
        });
    }

    /**
     * Create controls hint.
     * @param {StackPanel} parent
     */
    createControlsHint(parent) {
        // Container
        const container = new Rectangle('controlsContainer');
        container.width = '350px';
        container.height = '150px';
        container.thickness = 0;
        container.paddingTop = '30px';

        parent.addControl(container);

        // Controls text
        const controlsText = new TextBlock('controls');
        controlsText.text =
            'CONTROLS\n\n' +
            'Arrow Keys / WASD - Move\n' +
            'SPACE - Shoot  |  R - Reload\n' +
            'Q E C X - Abilities\n' +
            'B - Buy Menu  |  ESC - Pause';
        controlsText.color = '#888888';
        controlsText.fontSize = 14;
        controlsText.fontFamily = 'Courier New, monospace';
        controlsText.textWrapping = true;
        controlsText.lineSpacing = '4px';

        container.addControl(controlsText);
    }

    /**
     * Update high score display.
     * @param {number} score
     * @param {number} wave
     */
    updateHighScore(score, wave) {
        this.highScoreText.text = `HIGH SCORE: ${score}`;
        this.highWaveText.text = `HIGHEST WAVE: ${wave}`;
    }

    /**
     * Show the menu.
     */
    show() {
        this.background.isVisible = true;
        this.panel.isVisible = true;
        this.isVisible = true;

        // Refresh high score display
        const highScoreData = this.saveManager.loadHighScore();
        this.updateHighScore(highScoreData.score, highScoreData.wave);
    }

    /**
     * Hide the menu.
     */
    hide() {
        this.background.isVisible = false;
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
