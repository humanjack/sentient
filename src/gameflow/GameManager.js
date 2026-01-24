/**
 * GameManager.js - Central game state and flow management.
 * Uses WaveManager for wave progression and HUD for display.
 */
import { WaveManager } from './WaveManager.js';
import { ScoreManager } from './ScoreManager.js';
import { SaveManager } from './SaveManager.js';
import { BuyPhase } from './BuyPhase.js';
import { HUD } from '../ui/HUD.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { MainMenuUI } from '../ui/MainMenuUI.js';
import { PauseMenuUI } from '../ui/PauseMenuUI.js';
import { TutorialHints } from '../ui/TutorialHints.js';
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
        this.abilitySystem = options.abilitySystem || null;

        // Game state: 'menu', 'playing', 'paused', 'buyPhase', 'gameOver'
        this.gameState = 'menu';
        this.isPaused = false;

        // Stats
        this.totalKills = 0;

        // Initialize SaveManager
        this.saveManager = SaveManager.getInstance();

        // Create Main Menu UI
        this.mainMenuUI = new MainMenuUI(this.scene, () => this.handlePlayClicked());

        // Create Pause Menu UI
        this.pauseMenuUI = new PauseMenuUI(this.scene, {
            onResume: () => this.resumeGame(),
            onRestart: () => this.restartGame(),
            onMainMenu: () => this.returnToMainMenu(),
        });

        // Create HUD (needed for callbacks)
        this.hud = new HUD(this.scene);
        this.hud.hide(); // Hidden until game starts

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
        this.gameOverUI = new GameOverUI(this.scene, {
            onRestart: () => this.restartGame(),
            onMainMenu: () => this.returnToMainMenu(),
        });

        // Create Wave Manager
        this.waveManager = new WaveManager({
            spawner: this.spawner,
            onWaveStart: (wave, enemyCount) => this.handleWaveStart(wave, enemyCount),
            onWaveComplete: (wave) => this.handleWaveComplete(wave),
            onBuyPhaseStart: (duration) => this.handleBuyPhaseStart(duration),
            onBuyPhaseEnd: () => this.handleBuyPhaseEnd(),
            onEnemyCountChange: (count) => this.handleEnemyCountChange(count),
            onBossWaveStart: (wave) => this.handleBossWaveStart(wave),
            onBossDefeated: (wave) => this.handleBossDefeated(wave),
        });

        // Setup spawner boss callbacks
        if (this.spawner) {
            this.spawner.onBossCreated = (boss) => this.handleBossCreated(boss);
            this.spawner.onBossDeath = (boss) => this.handleBossDeath(boss);
            this.spawner.onBossHealthChanged = (current, max) => this.handleBossHealthChanged(current, max);
        }

        // Create Buy Phase Manager
        this.buyPhase = new BuyPhase({
            scene: this.scene,
            playerHealth: this.playerHealth,
            getWeapon: this.getWeapon,
            getWeaponInventory: this.getWeaponInventory,
            onSkip: () => this.handleBuyPhaseSkip(),
            onControlsChanged: (scheme) => this.handleControlsChanged(scheme),
        });

        console.log('GameManager initialized with all UI systems');
    }

    /**
     * Handle Play button clicked from main menu.
     */
    handlePlayClicked() {
        this.mainMenuUI.hide();
        this.startGame();
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
     * Toggle pause state (ESC key).
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.pauseGame();
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }

    /**
     * Pause the game.
     */
    pauseGame() {
        if (this.gameState !== 'playing') return;

        this.gameState = 'paused';
        this.isPaused = true;
        this.pauseMenuUI.show();
        console.log('Game paused');
    }

    /**
     * Resume the game from pause.
     */
    resumeGame() {
        if (this.gameState !== 'paused') return;

        this.gameState = 'playing';
        this.isPaused = false;
        this.pauseMenuUI.hide();
        console.log('Game resumed');
    }

    /**
     * Return to main menu.
     */
    returnToMainMenu() {
        console.log('Returning to main menu...');
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
     * Handle boss wave start.
     * @param {number} wave
     */
    handleBossWaveStart(wave) {
        this.hud.showMessage('BOSS WAVE!', 3000);
    }

    /**
     * Handle boss created.
     * @param {EnemyBoss} boss
     */
    handleBossCreated(boss) {
        console.log('Boss created - showing health bar');

        // Show boss health bar
        this.hud.showBossHealth('WATCHER', boss.health, boss.maxHealth);

        // Register drone camera target (priority 0)
        if (this.camera && boss.getDroneCameraTarget) {
            const droneTarget = boss.getDroneCameraTarget();
            if (droneTarget) {
                this.camera.registerTarget(droneTarget);
            }
        }

        // Set up boss health change callback
        boss.onBossHealthChanged = (current, max) => {
            this.hud.updateBossHealth(current, max);
        };
    }

    /**
     * Handle boss health changed.
     * @param {number} current
     * @param {number} max
     */
    handleBossHealthChanged(current, max) {
        this.hud.updateBossHealth(current, max);
    }

    /**
     * Handle boss death.
     * @param {EnemyBoss} boss
     */
    handleBossDeath(boss) {
        console.log('Boss defeated!');

        // Hide boss health bar
        this.hud.hideBossHealth();

        // Unregister drone camera
        if (this.camera && boss.getDroneCameraTarget) {
            const droneTarget = boss.getDroneCameraTarget();
            if (droneTarget) {
                this.camera.onTargetDestroyed(droneTarget);
            }
        }

        // Notify wave manager
        if (this.waveManager) {
            this.waveManager.onBossKilled();
        }
    }

    /**
     * Handle boss defeated (from wave manager).
     * @param {number} wave
     */
    handleBossDefeated(wave) {
        this.hud.showMessage('BOSS DEFEATED!', 3000);
        this.hud.showPointPopup(1000, '#ff88ff');
    }

    /**
     * Start the game - spawn first wave.
     */
    startGame() {
        this.gameState = 'playing';
        this.totalKills = 0;
        this.isPaused = false;

        // Show HUD
        this.hud.show();

        // Show tutorial hints on first play
        if (!this.tutorialHints) {
            this.tutorialHints = new TutorialHints(this.scene);
        }

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

        // Add ultimate charge
        if (this.abilitySystem) {
            this.abilitySystem.addKillCharge();
        }

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
        // Don't update if game is over or on menu
        if (this.gameState === 'gameOver' || this.gameState === 'menu') {
            return;
        }

        // If paused (pause menu or buy menu), only update necessary timers
        if (this.gameState === 'paused') {
            return;
        }

        if (this.isPaused) {
            // Still update wave manager for timer countdown during buy phase
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
