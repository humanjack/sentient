/**
 * WaveManager.js - Handles wave progression, timing, and state transitions.
 */
import { ScoreManager } from './ScoreManager.js';

export class WaveManager {
    /**
     * Create wave manager.
     * @param {Object} options
     * @param {EnemySpawner} options.spawner - Enemy spawner reference
     * @param {function} options.onWaveStart - Called when wave starts
     * @param {function} options.onWaveComplete - Called when wave cleared
     * @param {function} options.onBuyPhaseStart - Called when buy phase begins
     * @param {function} options.onBuyPhaseEnd - Called when buy phase ends
     * @param {function} options.onEnemyCountChange - Called when enemy count changes
     */
    constructor(options = {}) {
        this.spawner = options.spawner;
        this.onWaveStart = options.onWaveStart || null;
        this.onWaveComplete = options.onWaveComplete || null;
        this.onBuyPhaseStart = options.onBuyPhaseStart || null;
        this.onBuyPhaseEnd = options.onBuyPhaseEnd || null;
        this.onEnemyCountChange = options.onEnemyCountChange || null;

        // Wave state
        this.currentWave = 0;
        this.waveState = 'idle'; // 'idle', 'spawning', 'inProgress', 'completed', 'buyPhase'

        // Wave configuration
        this.baseEnemyCount = 3;
        this.enemiesPerWaveMultiplier = 2;

        // Timers
        this.buyPhaseDuration = 15; // seconds
        this.buyPhaseTimer = 0;
        this.waveCompletePauseDuration = 3; // seconds
        this.waveCompletePauseTimer = 0;

        // Enemy tracking
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.enemiesRemaining = 0;

        // Boss tracking
        this.isBossWave = false;
        this.bossDefeated = false;
        this.onBossWaveStart = options.onBossWaveStart || null;
        this.onBossDefeated = options.onBossDefeated || null;

        console.log('WaveManager initialized');
    }

    /**
     * Check if a wave is a boss wave.
     * @param {number} waveNumber
     * @returns {boolean}
     */
    isBossWaveNumber(waveNumber) {
        // Boss appears every 10 waves (10, 20, 30...)
        return waveNumber > 0 && waveNumber % 10 === 0;
    }

    /**
     * Calculate enemies for a given wave.
     * @param {number} waveNumber
     * @returns {number}
     */
    calculateEnemyCount(waveNumber) {
        return this.baseEnemyCount + (waveNumber * this.enemiesPerWaveMultiplier);
    }

    /**
     * Get wave composition based on wave number.
     * Wave 1-3: Grunts only
     * Wave 4-6: Grunts + Soldiers
     * Wave 7-9: Grunts + Soldiers + Snipers
     * Wave 10+: All types including Heavy
     * @param {number} waveNumber
     * @returns {Object} Enemy type counts { grunt: N, soldier: N, ... }
     */
    getWaveComposition(waveNumber) {
        const totalEnemies = this.calculateEnemyCount(waveNumber);
        const composition = { grunt: 0, soldier: 0, sniper: 0, heavy: 0 };

        if (waveNumber <= 3) {
            // Waves 1-3: Only grunts
            composition.grunt = totalEnemies;
        } else if (waveNumber <= 6) {
            // Waves 4-6: 60% grunts, 40% soldiers
            composition.grunt = Math.ceil(totalEnemies * 0.6);
            composition.soldier = totalEnemies - composition.grunt;
        } else if (waveNumber <= 9) {
            // Waves 7-9: 50% grunts, 30% soldiers, 20% snipers
            composition.grunt = Math.ceil(totalEnemies * 0.5);
            composition.soldier = Math.ceil(totalEnemies * 0.3);
            composition.sniper = totalEnemies - composition.grunt - composition.soldier;
        } else {
            // Wave 10+: 40% grunts, 25% soldiers, 20% snipers, 15% heavy
            composition.grunt = Math.ceil(totalEnemies * 0.4);
            composition.soldier = Math.ceil(totalEnemies * 0.25);
            composition.sniper = Math.ceil(totalEnemies * 0.2);
            composition.heavy = totalEnemies - composition.grunt - composition.soldier - composition.sniper;
            // Ensure at least 1 heavy in wave 10+
            if (composition.heavy < 1) {
                composition.heavy = 1;
                composition.grunt--;
            }
        }

        // Remove zero counts
        for (const type in composition) {
            if (composition[type] <= 0) {
                delete composition[type];
            }
        }

        return composition;
    }

    /**
     * Start the wave system.
     */
    start() {
        this.currentWave = 0;
        this.startNextWave();
    }

    /**
     * Start the next wave.
     */
    startNextWave() {
        this.currentWave++;
        this.waveState = 'spawning';
        this.bossDefeated = false;

        // Check if this is a boss wave
        this.isBossWave = this.isBossWaveNumber(this.currentWave);

        if (this.isBossWave) {
            // Boss wave - spawn boss only (boss spawns minions)
            this.enemiesSpawned = 1;
            this.enemiesKilled = 0;
            this.enemiesRemaining = 1;

            console.log(`=== BOSS WAVE ${this.currentWave} === THE WATCHER`);

            // Notify listeners
            if (this.onWaveStart) {
                this.onWaveStart(this.currentWave, 1);
            }
            if (this.onBossWaveStart) {
                this.onBossWaveStart(this.currentWave);
            }

            // Spawn the boss
            this.spawner.spawnBoss();
        } else {
            // Normal wave - get wave composition based on wave number
            const composition = this.getWaveComposition(this.currentWave);
            const enemyCount = Object.values(composition).reduce((a, b) => a + b, 0);

            this.enemiesSpawned = enemyCount;
            this.enemiesKilled = 0;
            this.enemiesRemaining = enemyCount;

            console.log(`=== WAVE ${this.currentWave} === (${enemyCount} enemies)`);
            console.log('Composition:', composition);

            // Notify listeners
            if (this.onWaveStart) {
                this.onWaveStart(this.currentWave, enemyCount);
            }

            // Spawn enemies with mixed types
            this.spawner.spawnWaveWithTypes(composition, 500);
        }

        // Transition to inProgress once spawning begins
        this.waveState = 'inProgress';
    }

    /**
     * Called when boss is defeated.
     */
    onBossKilled() {
        this.bossDefeated = true;

        if (this.onBossDefeated) {
            this.onBossDefeated(this.currentWave);
        }

        // Boss counts as wave clear
        this.onWaveCleared();
    }

    /**
     * Called when an enemy is killed.
     */
    onEnemyKilled() {
        this.enemiesKilled++;
        this.enemiesRemaining = this.enemiesSpawned - this.enemiesKilled;

        // Notify listeners
        if (this.onEnemyCountChange) {
            this.onEnemyCountChange(this.enemiesRemaining);
        }

        // Check if wave is cleared
        if (this.enemiesRemaining <= 0) {
            this.onWaveCleared();
        }
    }

    /**
     * Called when all enemies in wave are dead.
     */
    onWaveCleared() {
        this.waveState = 'completed';
        this.waveCompletePauseTimer = this.waveCompletePauseDuration;

        console.log(`Wave ${this.currentWave} complete!`);

        // Add wave bonus to score
        const scoreManager = ScoreManager.getInstance();
        if (scoreManager) {
            scoreManager.addWaveBonus(this.currentWave);
        }

        // Notify listeners
        if (this.onWaveComplete) {
            this.onWaveComplete(this.currentWave);
        }
    }

    /**
     * Start the buy phase.
     */
    startBuyPhase() {
        this.waveState = 'buyPhase';
        this.buyPhaseTimer = this.buyPhaseDuration;

        console.log('Buy phase started - 15 seconds');

        // Notify listeners
        if (this.onBuyPhaseStart) {
            this.onBuyPhaseStart(this.buyPhaseDuration);
        }
    }

    /**
     * End the buy phase and start next wave.
     */
    endBuyPhase() {
        console.log('Buy phase ended');

        // Notify listeners
        if (this.onBuyPhaseEnd) {
            this.onBuyPhaseEnd();
        }

        this.startNextWave();
    }

    /**
     * Update wave manager. Call every frame.
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        switch (this.waveState) {
            case 'completed':
                // Count down the pause after wave complete
                this.waveCompletePauseTimer -= deltaTime;
                if (this.waveCompletePauseTimer <= 0) {
                    this.startBuyPhase();
                }
                break;

            case 'buyPhase':
                // Count down buy phase timer
                this.buyPhaseTimer -= deltaTime;
                if (this.buyPhaseTimer <= 0) {
                    this.endBuyPhase();
                }
                break;

            case 'inProgress':
                // Update enemy count from spawner (in case enemies die)
                const aliveCount = this.spawner.getAliveCount();
                if (aliveCount !== this.enemiesRemaining && aliveCount < this.enemiesRemaining) {
                    // Enemies died - update count
                    this.enemiesRemaining = aliveCount;
                    if (this.onEnemyCountChange) {
                        this.onEnemyCountChange(this.enemiesRemaining);
                    }
                    if (this.enemiesRemaining <= 0) {
                        this.onWaveCleared();
                    }
                }
                break;
        }
    }

    /**
     * Get current wave number.
     * @returns {number}
     */
    getCurrentWave() {
        return this.currentWave;
    }

    /**
     * Get current wave state.
     * @returns {string}
     */
    getState() {
        return this.waveState;
    }

    /**
     * Get remaining buy phase time.
     * @returns {number}
     */
    getBuyPhaseTimeRemaining() {
        return Math.ceil(this.buyPhaseTimer);
    }

    /**
     * Get enemies remaining count.
     * @returns {number}
     */
    getEnemiesRemaining() {
        return this.enemiesRemaining;
    }

    /**
     * Skip the buy phase and start next wave immediately.
     */
    skipBuyPhase() {
        if (this.waveState !== 'buyPhase') return;

        console.log('Buy phase skipped!');
        this.endBuyPhase();
    }
}
