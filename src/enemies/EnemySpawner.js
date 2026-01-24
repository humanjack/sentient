/**
 * EnemySpawner.js - Handles spawning enemies at designated spawn points.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { EnemyGrunt } from './EnemyGrunt.js';

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

        // Spawn tracking
        this.enemyCounter = 0;
    }

    /**
     * Spawn a single enemy at a specific position.
     * @param {Vector3} position - Where to spawn
     * @returns {EnemyGrunt} The spawned enemy
     */
    spawnEnemy(position) {
        this.enemyCounter++;

        const enemy = new EnemyGrunt(this.scene, position, {
            name: `Grunt_${this.enemyCounter}`,
            getPlayerPosition: this.getPlayerPosition,
            onDeath: (deadEnemy) => this.handleEnemyDeath(deadEnemy),
        });

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
     */
    spawnWave(count, delay = 300) {
        console.log(`Spawning wave of ${count} enemies...`);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const position = this.getRandomSpawnPoint();
                this.spawnEnemy(position);
            }, i * delay);
        }
    }

    /**
     * Spawn enemies with staggered timing (alias for spawnWave with custom delay).
     * @param {number} count - Number of enemies to spawn
     * @param {number} delayBetween - Delay between spawns in ms
     */
    spawnWaveWithDelay(count, delayBetween = 500) {
        console.log(`Spawning wave of ${count} enemies (${delayBetween}ms apart)...`);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.scene && !this.scene.isDisposed) {
                    const position = this.getRandomSpawnPoint();
                    this.spawnEnemy(position);
                }
            }, i * delayBetween);
        }
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
