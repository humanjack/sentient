/**
 * GameManager.js - Central game state and flow management.
 * Uses WaveManager for wave progression and HUD for display.
 */
import { WaveManager } from './WaveManager.js';
import { ScoreManager } from './ScoreManager.js';
import { BuyPhase } from './BuyPhase.js';
import { HUD } from '../ui/HUD.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { PlayerHealth } from '../player/PlayerHealth.js';

export class GameManager {
    // Singleton instance
    static instance = null;

    static getInstance() {
        return GameManager.instance;
    }

    /**
     * Create game manager.
     * @param {Object} options
     */
    constructor(options = {}) {
        // Singleton
        GameManager.instance = this;

        // References
        this.scene = options.scene;
        this.spawner = options.spawner;
        this.camera = options.camera;
        this.damageSystem = options.damageSystem;
        this.getWeapon = options.getWeapon || null;
        this.getWeaponInventory = options.getWeaponInventory || null;

        // Game state
        this.gameState = 'idle'; // 'idle', 'playing', 'paused', 'gameOver'
        this.isPaused = false;

        // Stats
        this.totalKills = 0;

        // Create HUD first (needed for callbacks)
        this.hud = new HUD(this.scene);

        // Create Score Manager
        this.scoreManager = new ScoreManager({
            onScoreChanged: (score) => this.handleScoreChanged(score),
            onCreditsChanged: (credits) => this.handleCreditsChanged(credits),
        });

        // Initialize score/credits displays
        this.hud.updateScore(this.scoreManager.getScore());
        this.hud.updateCredits(this.scoreManager.getCredits());

        // Create Player Health
        this.playerHealth = new PlayerHealth({
            onHealthChanged: (current, max) => this.handleHealthChanged(current, max),
            onShieldChanged: (current, max) => this.handleShieldChanged(current, max),
            onDamage: (amount) => this.handlePlayerDamage(amount),
            onDeath: () => this.handlePlayerDeath(),
        });

        // Initialize health/shield displays
        this.hud.updateHealth(this.playerHealth.currentHealth, this.playerHealth.maxHealth);
        this.hud.updateShield(this.playerHealth.currentShield, this.playerHealth.maxShield);

        // Create Game Over UI
        this.gameOverUI = new GameOverUI(this.scene, () => this.restartGame());

        // Create Wave Manager
        this.waveManager = new WaveManager({
            spawner: this.spawner,
            onWaveStart: (wave, enemyCount) => this.handleWaveStart(wave, enemyCount),
            onWaveComplete: (wave) => this.handleWaveComplete(wave),
            onBuyPhaseStart: (duration) => this.handleBuyPhaseStart(duration),
            onBuyPhaseEnd: () => this.handleBuyPhaseEnd(),
            onEnemyCountChange: (count) => this.handleEnemyCountChange(count),
        });

        // Create Buy Phase Manager
        this.buyPhase = new BuyPhase({
            scene: this.scene,
            playerHealth: this.playerHealth,
            getWeapon: this.getWeapon,
            getWeaponInventory: this.getWeaponInventory,
            onSkip: () => this.handleBuyPhaseSkip(),
            onControlsChanged: (scheme) => this.handleControlsChanged(scheme),
        });

        console.log('GameManager initialized with WaveManager, ScoreManager, BuyPhase, HUD, PlayerHealth, and GameOverUI');
    }

    /**
     * Handle score change.
     * @param {number} score
     */
    handleScoreChanged(score) {
        this.hud.updateScore(score);
    }

    /**
     * Handle credits change.
     * @param {number} credits
     */
    handleCreditsChanged(credits) {
        this.hud.updateCredits(credits);

        // Update buy menu if open
        if (this.buyPhase && this.buyPhase.isMenuOpen()) {
            this.buyPhase.refreshCredits();
        }
    }

    /**
     * Handle player health change.
     * @param {number} current
     * @param {number} max
     */
    handleHealthChanged(current, max) {
        this.hud.updateHealth(current, max);
    }

    /**
     * Handle player shield change.
     * @param {number} current
     * @param {number} max
     */
    handleShieldChanged(current, max) {
        this.hud.updateShield(current, max);
    }

    /**
     * Handle player taking damage.
     * @param {number} amount
     */
    handlePlayerDamage(amount) {
        this.hud.showDamageFlash();
    }

    /**
     * Handle player death.
     */
    handlePlayerDeath() {
        this.gameState = 'gameOver';

        // Close buy menu if open
        if (this.buyPhase) {
            this.buyPhase.close();
        }

        console.log('GAME OVER!');

        // Show game over UI with stats
        const wave = this.waveManager.getCurrentWave();
        const score = this.scoreManager.getScore();
        this.gameOverUI.show(wave, this.totalKills, score);
    }

    /**
     * Restart the game.
     */
    restartGame() {
        console.log('Restarting game...');
        location.reload();
    }

    /**
     * Handle wave start event.
     * @param {number} wave - Wave number
     * @param {number} enemyCount - Number of enemies in wave
     */
    handleWaveStart(wave, enemyCount) {
        this.hud.updateWave(wave);
        this.hud.updateEnemyCount(enemyCount);
        this.hud.hideBuyPhaseTimer();

        // Close buy menu when wave starts
        if (this.buyPhase) {
            this.buyPhase.close();
        }

        if (wave > 1) {
            this.hud.showMessage(`Wave ${wave}!`, 2000);
        }
    }

    /**
     * Handle wave complete event.
     * @param {number} wave - Completed wave number
     */
    handleWaveComplete(wave) {
        // Wave bonus is now added by WaveManager via ScoreManager
        this.hud.showMessage('Wave Complete!', 2500);

        // Show wave bonus popup
        const bonus = wave * 500;
        this.hud.showPointPopup(bonus, '#66ffff');
    }

    /**
     * Handle buy phase start.
     * @param {number} duration - Buy phase duration in seconds
     */
    handleBuyPhaseStart(duration) {
        // Show buy phase indicator (small alert, not full menu)
        this.hud.showBuyPhaseIndicator(duration);

        // Don't auto-open menu - player presses B to open
    }

    /**
     * Handle buy phase end.
     */
    handleBuyPhaseEnd() {
        this.hud.hideBuyPhaseIndicator();

        // Close buy menu if open
        if (this.buyPhase) {
            this.buyPhase.close();
        }

        // Unpause game
        this.isPaused = false;
    }

    /**
     * Handle buy phase skip (player clicked Ready).
     */
    handleBuyPhaseSkip() {
        if (this.waveManager) {
            this.waveManager.skipBuyPhase();
        }
    }

    /**
     * Handle control scheme change.
     * @param {string} scheme - 'arrows' or 'wasd'
     */
    handleControlsChanged(scheme) {
        // Update HUD
        if (this.hud) {
            this.hud.updateControlScheme(scheme);
            const message = scheme === 'arrows' ? 'Controls: Arrow Keys' : 'Controls: WASD';
            this.hud.showMessage(message, 1500);
        }
    }

    /**
     * Open buy menu (B key).
     */
    openBuyMenu() {
        // Only allow during buy phase
        if (this.waveManager && this.waveManager.getState() === 'buyPhase') {
            if (this.buyPhase && !this.buyPhase.isMenuOpen()) {
                // Update timer before opening
                const timeRemaining = this.waveManager.getBuyPhaseTimeRemaining();
                this.buyPhase.updateTimer(timeRemaining);

                this.buyPhase.open();
                this.isPaused = true;
            }
        }
    }

    /**
     * Close buy menu (Escape key).
     */
    closeBuyMenu() {
        if (this.buyPhase && this.buyPhase.isMenuOpen()) {
            this.buyPhase.close();
            this.isPaused = false;
        }
    }

    /**
     * Toggle buy menu (legacy - now use open/close).
     */
    toggleBuyMenu() {
        // Only allow during buy phase
        if (this.waveManager && this.waveManager.getState() === 'buyPhase') {
            if (this.buyPhase) {
                if (this.buyPhase.isMenuOpen()) {
                    this.closeBuyMenu();
                } else {
                    this.openBuyMenu();
                }
            }
        }
    }

    /**
     * Check if buy menu is open.
     * @returns {boolean}
     */
    isBuyMenuOpen() {
        return this.buyPhase && this.buyPhase.isMenuOpen();
    }

    /**
     * Handle enemy count change.
     * @param {number} count - Remaining enemies
     */
    handleEnemyCountChange(count) {
        this.hud.updateEnemyCount(count);
    }

    /**
     * Start the game - spawn first wave.
     */
    startGame() {
        this.gameState = 'playing';
        this.totalKills = 0;

        // Reset score manager
        this.scoreManager.reset();
        this.hud.updateScore(0);
        this.hud.updateCredits(0);

        // Reset player health
        this.playerHealth.reset();
        this.hud.updateHealth(this.playerHealth.currentHealth, this.playerHealth.maxHealth);
        this.hud.updateShield(this.playerHealth.currentShield, this.playerHealth.maxShield);

        this.waveManager.start();

        console.log('Game started!');
    }

    /**
     * Called when an enemy is killed.
     * @param {EnemyBase} enemy
     */
    onEnemyKilled(enemy) {
        this.totalKills++;

        console.log(`Kill #${this.totalKills}!`);

        // Show kill reward popup
        this.hud.showPointPopup(100, '#ffff66');

        // Notify wave manager
        this.waveManager.onEnemyKilled();

        // Unregister from camera
        if (this.camera) {
            this.camera.onTargetDestroyed(enemy.getCameraTarget());
        }

        // Unregister from damage system
        if (this.damageSystem) {
            this.damageSystem.unregisterEnemy(enemy.mesh);
        }
    }

    /**
     * Called when enemy is created by spawner.
     * @param {EnemyBase} enemy
     */
    onEnemyCreated(enemy) {
        // Register with camera system
        if (this.camera) {
            this.camera.registerTarget(enemy.getCameraTarget());
        }

        // Register with damage system
        if (this.damageSystem) {
            this.damageSystem.registerEnemy(enemy.mesh, enemy);
        }
    }

    /**
     * Called when all enemies in wave are dead (from spawner).
     * This is a backup - WaveManager tracks this internally too.
     */
    onWaveComplete() {
        // WaveManager handles this now through enemy count tracking
    }

    /**
     * Update game manager. Call every frame.
     * @param {number} deltaTime
     */
    update(deltaTime) {
        // Don't update if game is over
        if (this.gameState === 'gameOver') {
            return;
        }

        // If paused (buy menu open), only update timer displays
        if (this.isPaused) {
            // Still update wave manager for timer countdown
            if (this.waveManager && this.waveManager.getState() === 'buyPhase') {
                this.waveManager.update(deltaTime);
                const timeRemaining = this.waveManager.getBuyPhaseTimeRemaining();

                // Update buy menu timer
                if (this.buyPhase && this.buyPhase.isMenuOpen()) {
                    this.buyPhase.updateTimer(timeRemaining);
                }
            }
            return;
        }

        // Update spawner (which updates all enemies)
        if (this.spawner) {
            this.spawner.update(deltaTime);
        }

        // Update wave manager
        if (this.waveManager) {
            this.waveManager.update(deltaTime);

            // Update buy phase indicator if in buy phase
            if (this.waveManager.getState() === 'buyPhase') {
                const timeRemaining = this.waveManager.getBuyPhaseTimeRemaining();
                this.hud.updateBuyPhaseIndicator(timeRemaining);
            }
        }
    }

    /**
     * Get current game state.
     * @returns {string}
     */
    getState() {
        return this.gameState;
    }

    /**
     * Get current stats.
     * @returns {Object}
     */
    getStats() {
        return {
            kills: this.totalKills,
            wave: this.waveManager ? this.waveManager.getCurrentWave() : 0,
            score: this.scoreManager ? this.scoreManager.getScore() : 0,
            credits: this.scoreManager ? this.scoreManager.getCredits() : 0,
            enemiesAlive: this.spawner ? this.spawner.getAliveCount() : 0,
        };
    }
}
