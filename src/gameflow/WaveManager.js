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

        console.log('WaveManager initialized');
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

        const enemyCount = this.calculateEnemyCount(this.currentWave);
        this.enemiesSpawned = enemyCount;
        this.enemiesKilled = 0;
        this.enemiesRemaining = enemyCount;

        console.log(`=== WAVE ${this.currentWave} === (${enemyCount} enemies)`);

        // Notify listeners
        if (this.onWaveStart) {
            this.onWaveStart(this.currentWave, enemyCount);
        }

        // Spawn enemies with staggered timing
        this.spawner.spawnWaveWithDelay(enemyCount, 500);

        // Transition to inProgress once spawning begins
        this.waveState = 'inProgress';
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
