/**
 * WaveStatsUI.js - Post-wave statistics display.
 * Shows stats after wave completion before buy phase.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class WaveStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.enemiesKilled = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.headshots = 0;
        this.damageTaken = 0;
        this.creditsEarned = 0;
        this.startTime = performance.now();
        this.endTime = 0;
    }

    getAccuracy() {
        if (this.shotsFired === 0) return 0;
        return Math.round((this.shotsHit / this.shotsFired) * 100);
    }

    getElapsedTime() {
        const end = this.endTime || performance.now();
        return Math.round((end - this.startTime) / 1000);
    }
}

export class WaveStatsUI {
    constructor(scene) {
        this.scene = scene;
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('WaveStats', true, scene);
        this.gui.idealHeight = 720;
        this.container = null;
        this.isVisible = false;
        this.hideTimeout = null;
        this.createUI();
        this.hide();
    }

    createUI() {
        // Background overlay
        this.container = new Rectangle('waveStatsContainer');
        this.container.width = '400px';
        this.container.height = '350px';
        this.container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.container.background = 'rgba(0, 0, 0, 0.85)';
        this.container.thickness = 3;
        this.container.color = '#66ffff';
        this.container.cornerRadius = 12;
        this.gui.addControl(this.container);

        // Stack panel for stats
        this.panel = new StackPanel('statsPanel');
        this.panel.width = '360px';
        this.panel.paddingTop = '15px';
        this.container.addControl(this.panel);

        // Title
        this.titleText = this._createText('WAVE COMPLETE', '#66ffff', 28, true);
        this.panel.addControl(this.titleText);

        // Stat lines
        this.statsLines = {};
        const statNames = [
            'wave', 'enemiesKilled', 'accuracy', 'headshots',
            'damageTaken', 'creditsEarned', 'time'
        ];
        for (const name of statNames) {
            const text = this._createText('', '#cccccc', 20, false);
            text.paddingTop = '6px';
            this.panel.addControl(text);
            this.statsLines[name] = text;
        }
    }

    _createText(text, color, fontSize, bold) {
        const tb = new TextBlock();
        tb.text = text;
        tb.color = color;
        tb.fontSize = fontSize;
        tb.fontFamily = 'Courier New, monospace';
        if (bold) tb.fontWeight = 'bold';
        tb.height = `${fontSize + 10}px`;
        tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        tb.shadowColor = 'black';
        tb.shadowBlur = 4;
        return tb;
    }

    show(waveNumber, stats, displayDuration = 3500) {
        if (this.hideTimeout) clearTimeout(this.hideTimeout);

        this.titleText.text = `WAVE ${waveNumber} COMPLETE`;
        this.statsLines.wave.text = `Wave: ${waveNumber}`;
        this.statsLines.enemiesKilled.text = `Enemies Killed: ${stats.enemiesKilled}`;
        this.statsLines.accuracy.text = `Accuracy: ${stats.getAccuracy()}%`;
        this.statsLines.headshots.text = `Headshots: ${stats.headshots}`;
        this.statsLines.damageTaken.text = `Damage Taken: ${stats.damageTaken}`;
        this.statsLines.creditsEarned.text = `Credits Earned: ${stats.creditsEarned}`;
        this.statsLines.time.text = `Time: ${stats.getElapsedTime()}s`;

        this.container.isVisible = true;
        this.isVisible = true;

        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, displayDuration);
    }

    hide() {
        if (this.container) this.container.isVisible = false;
        this.isVisible = false;
    }

    dispose() {
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        this.gui.dispose();
    }
}
