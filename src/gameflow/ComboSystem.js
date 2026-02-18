/**
 * ComboSystem.js - Tracks kill combos and provides score multipliers.
 */
export class ComboSystem {
    constructor() {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboWindow = 3000; // 3s ms
        this.maxCombo = 0;
        this.onComboChanged = null;
    }

    registerKill() {
        this.comboCount++;
        this.comboTimer = performance.now();
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
        if (this.onComboChanged) this.onComboChanged(this.comboCount);
    }

    update() {
        if (this.comboCount > 0 && performance.now() - this.comboTimer > this.comboWindow) {
            this.comboCount = 0;
            if (this.onComboChanged) this.onComboChanged(0);
        }
    }

    getScoreMultiplier() {
        return Math.max(1, 1 + (this.comboCount - 1) * 0.25);
    }

    reset() {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
    }
}
