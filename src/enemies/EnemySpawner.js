/**
 * EnemySpawner.js - Handles spawning enemies at designated spawn points.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { EnemyGrunt } from './EnemyGrunt.js';
import { EnemySoldier } from './EnemySoldier.js';
import { EnemySniper } from './EnemySniper.js';
import { EnemyHeavy } from './EnemyHeavy.js';
import { EnemyBoss } from './EnemyBoss.js';

export class EnemySpawner {
    /**
     * Create enemy spawner.
     * @param {Object} options
     * @param {Scene} options.scene - Babylon.js scene
     * @param {Vector3[]} options.spawnPoints - Array of spawn positions
     * @param {function} options.getPlayerPosition - Function to get player position
     * @param {function} options.onEnemyCreated - Called when enemy is created
     * @param {function} options.onEnemyDeath - Called when enemy dies
     * @param {function} options.onAllEnemiesDead - Called when all enemies are dead
     */
    constructor(options = {}) {
        this.scene = options.scene;
        this.spawnPoints = options.spawnPoints || [];
        this.getPlayerPosition = options.getPlayerPosition || (() => Vector3.Zero());
        this.onEnemyCreated = options.onEnemyCreated || null;
        this.onEnemyDeath = options.onEnemyDeath || null;
        this.onAllEnemiesDead = options.onAllEnemiesDead || null;

        // Active enemies
        this.activeEnemies = [];

        // Boss tracking
        this.currentBoss = null;
        this.onBossCreated = options.onBossCreated || null;
        this.onBossDeath = options.onBossDeath || null;

        // Spawn tracking
        this.enemyCounter = 0;

        // Difficulty scaling
        this.currentWaveNumber = 1;
    }

    /**
     * Get wave difficulty multipliers. Scaling starts after wave 10.
     * @param {number} waveNumber
     * @returns {Object} { health, speed, damage }
     */
    getWaveMultipliers(waveNumber) {
        if (waveNumber <= 10) {
            return { health: 1, speed: 1, damage: 1 };
        }
        const w = waveNumber - 10;
        return {
            health: 1 + w * 0.05,
            speed: 1 + w * 0.02,
            damage: 1 + w * 0.03,
        };
    }

    /**
     * Set the current wave number for difficulty scaling.
     * @param {number} waveNumber
     */
    setWaveNumber(waveNumber) {
        this.currentWaveNumber = waveNumber;
    }

    /**
     * Spawn a single enemy at a specific position.
     * @param {Vector3} position - Where to spawn
     * @param {string} type - Enemy type: 'grunt', 'soldier', 'sniper', 'heavy'
     * @returns {EnemyBase} The spawned enemy
     */
    spawnEnemy(position, type = 'grunt') {
        this.enemyCounter++;

        let enemy;
        const options = {
            getPlayerPosition: this.getPlayerPosition,
            onDeath: (deadEnemy) => this.handleEnemyDeath(deadEnemy),
        };

        switch (type.toLowerCase()) {
            case 'soldier':
                options.name = `Soldier_${this.enemyCounter}`;
                enemy = new EnemySoldier(this.scene, position, options);
                break;
            case 'sniper':
                options.name = `Sniper_${this.enemyCounter}`;
                enemy = new EnemySniper(this.scene, position, options);
                break;
            case 'heavy':
                options.name = `Heavy_${this.enemyCounter}`;
                enemy = new EnemyHeavy(this.scene, position, options);
                break;
            case 'grunt':
            default:
                options.name = `Grunt_${this.enemyCounter}`;
                enemy = new EnemyGrunt(this.scene, position, options);
                break;
        }

        // Apply difficulty scaling
        const multipliers = this.getWaveMultipliers(this.currentWaveNumber);
        if (multipliers.health !== 1 || multipliers.speed !== 1 || multipliers.damage !== 1) {
            enemy.maxHealth = Math.round(enemy.maxHealth * multipliers.health);
            enemy.health = enemy.maxHealth;
            enemy.speed *= multipliers.speed;
            enemy.damage = Math.round(enemy.damage * multipliers.damage);
        }

        this.activeEnemies.push(enemy);

        // Notify listeners
        if (this.onEnemyCreated) {
            this.onEnemyCreated(enemy);
        }

        console.log(`Spawned ${enemy.cameraTarget.name} at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);

        return enemy;
    }

    /**
     * Spawn multiple enemies with slight delay between each.
     * @param {number} count - Number of enemies to spawn
     * @param {number} delay - Delay between spawns in ms (default 300)
     * @param {string} type - Enemy type (default 'grunt')
     */
    spawnWave(count, delay = 300, type = 'grunt') {
        console.log(`Spawning wave of ${count} ${type} enemies...`);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const position = this.getRandomSpawnPoint();
                this.spawnEnemy(position, type);
            }, i * delay);
        }
    }

    /**
     * Spawn enemies with staggered timing (alias for spawnWave with custom delay).
     * @param {number} count - Number of enemies to spawn
     * @param {number} delayBetween - Delay between spawns in ms
     * @param {string} type - Enemy type (default 'grunt')
     */
    spawnWaveWithDelay(count, delayBetween = 500, type = 'grunt') {
        console.log(`Spawning wave of ${count} ${type} enemies (${delayBetween}ms apart)...`);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.scene && !this.scene.isDisposed) {
                    const position = this.getRandomSpawnPoint();
                    this.spawnEnemy(position, type);
                }
            }, i * delayBetween);
        }
    }

    /**
     * Spawn a wave with mixed enemy types.
     * @param {Object} enemyCounts - Object with enemy type counts, e.g., { grunt: 3, soldier: 2 }
     * @param {number} delayBetween - Delay between spawns in ms
     */
    spawnWaveWithTypes(enemyCounts, delayBetween = 500) {
        // Build array of enemy types to spawn
        const enemies = [];
        for (const [type, count] of Object.entries(enemyCounts)) {
            for (let i = 0; i < count; i++) {
                enemies.push(type);
            }
        }

        // Shuffle for variety
        for (let i = enemies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [enemies[i], enemies[j]] = [enemies[j], enemies[i]];
        }

        console.log(`Spawning mixed wave: ${JSON.stringify(enemyCounts)} (${enemies.length} total)`);

        // Spawn with delay
        for (let i = 0; i < enemies.length; i++) {
            setTimeout(() => {
                if (this.scene && !this.scene.isDisposed) {
                    const position = this.getRandomSpawnPoint();
                    this.spawnEnemy(position, enemies[i]);
                }
            }, i * delayBetween);
        }
    }

    /**
     * Spawn the boss enemy.
     * @param {Vector3} position - Where to spawn (optional, defaults to center-ish)
     * @returns {EnemyBoss} The spawned boss
     */
    spawnBoss(position = null) {
        // Default position - center of arena, offset
        if (!position) {
            position = new Vector3(0, 0, 15);
        }

        this.enemyCounter++;

        const boss = new EnemyBoss(this.scene, position, {
            name: 'Watcher',
            getPlayerPosition: this.getPlayerPosition,
            spawner: this, // Pass spawner for minion spawning
            onDeath: (deadBoss) => this.handleBossDeath(deadBoss),
            onBossHealthChanged: (current, max) => {
                // This will be connected to HUD by GameManager
                if (this.onBossHealthChanged) {
                    this.onBossHealthChanged(current, max);
                }
            },
        });

        this.activeEnemies.push(boss);
        this.currentBoss = boss;

        // Notify listeners
        if (this.onEnemyCreated) {
            this.onEnemyCreated(boss);
        }
        if (this.onBossCreated) {
            this.onBossCreated(boss);
        }

        console.log(`BOSS SPAWNED: ${boss.cameraTarget.name} at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);

        return boss;
    }

    /**
     * Handle boss death specifically.
     * @param {EnemyBoss} boss
     */
    handleBossDeath(boss) {
        this.currentBoss = null;

        // Notify boss-specific listener
        if (this.onBossDeath) {
            this.onBossDeath(boss);
        }

        // Also handle as normal enemy death
        this.handleEnemyDeath(boss);
    }

    /**
     * Get current boss if alive.
     * @returns {EnemyBoss|null}
     */
    getCurrentBoss() {
        return this.currentBoss;
    }

    /**
     * Check if boss is currently alive.
     * @returns {boolean}
     */
    isBossAlive() {
        return this.currentBoss !== null && this.currentBoss.isAlive;
    }

    /**
     * Get a random spawn point.
     * @returns {Vector3} Random spawn position
     */
    getRandomSpawnPoint() {
        if (this.spawnPoints.length === 0) {
            return new Vector3(0, 0, 20);
        }

        const index = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[index].clone();
    }

    /**
     * Handle enemy death internally.
     * @param {EnemyBase} enemy
     */
    handleEnemyDeath(enemy) {
        this.removeEnemy(enemy);

        // Notify external listener
        if (this.onEnemyDeath) {
            this.onEnemyDeath(enemy);
        }

        // Check if all enemies dead
        if (this.activeEnemies.length === 0) {
            console.log('All enemies dead!');
            if (this.onAllEnemiesDead) {
                this.onAllEnemiesDead();
            }
        }
    }

    /**
     * Remove enemy from active list.
     * @param {EnemyBase} enemy
     */
    removeEnemy(enemy) {
        const index = this.activeEnemies.indexOf(enemy);
        if (index !== -1) {
            this.activeEnemies.splice(index, 1);
        }
    }

    /**
     * Get count of alive enemies.
     * @returns {number}
     */
    getAliveCount() {
        return this.activeEnemies.filter(e => e.isAlive).length;
    }

    /**
     * Get all active enemies.
     * @returns {EnemyBase[]}
     */
    getActiveEnemies() {
        return this.activeEnemies;
    }

    /**
     * Get all alive enemies.
     * @returns {EnemyBase[]}
     */
    getAliveEnemies() {
        return this.activeEnemies.filter(e => e.isAlive);
    }

    /**
     * Update all enemies.
     * @param {number} deltaTime
     */
    update(deltaTime) {
        for (const enemy of this.activeEnemies) {
            if (enemy.isAlive) {
                enemy.update(deltaTime);
            }
        }
    }

    /**
     * Clear all enemies.
     */
    clearAll() {
        for (const enemy of this.activeEnemies) {
            if (enemy.mesh) {
                enemy.mesh.dispose();
            }
        }
        this.activeEnemies = [];
    }
}
