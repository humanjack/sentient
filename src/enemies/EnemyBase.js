/**
 * EnemyBase.js - Base class for all enemies.
 * Handles health, death, camera target registration, and basic state.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CameraTarget } from '../camera/CameraTarget.js';
import { ScoreManager } from '../gameflow/ScoreManager.js';
import { AudioManager } from '../audio/AudioManager.js';

export class EnemyBase {
    /**
     * Create a base enemy.
     * @param {Scene} scene - Babylon.js scene
     * @param {Vector3} position - Starting position
     * @param {Object} options - Enemy configuration
     */
    constructor(scene, position, options = {}) {
        this.scene = scene;
        this.position = position.clone();

        // Stats
        this.maxHealth = options.maxHealth || 100;
        this.health = this.maxHealth;
        this.speed = options.speed || 3;
        this.damage = options.damage || 10;

        // Enemy type for scoring (override in subclasses)
        this.enemyType = options.enemyType || 'grunt';

        // State
        this.isAlive = true;
        this.mesh = null;
        this.isStunned = false;
        this.stunDuration = 0;

        // Camera target - enemies have priority 1 (preferred over security cams)
        this.cameraTarget = new CameraTarget({
            mesh: null, // Will be set when mesh is created
            priority: 1,
            name: options.name || 'Enemy',
            offset: new Vector3(0, 1.8, 0), // Eye level
        });

        // Callbacks
        this.onDeath = options.onDeath || null;

        // Reference to player position getter (set by Game)
        this.getPlayerPosition = options.getPlayerPosition || (() => Vector3.Zero());
    }

    /**
     * Create the enemy mesh. Override in subclasses.
     */
    createMesh() {
        // Subclasses should implement this
    }

    /**
     * Set the mesh and update camera target.
     * @param {Mesh} mesh
     */
    setMesh(mesh) {
        this.mesh = mesh;
        this.mesh.position = this.position;
        this.cameraTarget.mesh = mesh;
    }

    /**
     * Take damage. Dies if health reaches 0.
     * @param {number} amount - Damage amount
     */
    takeDamage(amount) {
        if (!this.isAlive) return;

        this.health -= amount;
        console.log(`${this.cameraTarget.name} took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);

        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * Kill this enemy.
     */
    die() {
        if (!this.isAlive) return;

        this.isAlive = false;
        this.cameraTarget.deactivate();

        console.log(`${this.cameraTarget.name} died!`);

        // Play death sound
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSound('enemy_death');
        }

        // Add score and credits
        const scoreManager = ScoreManager.getInstance();
        if (scoreManager) {
            scoreManager.addKill(this.enemyType);
        }

        // Notify listeners
        if (this.onDeath) {
            this.onDeath(this);
        }

        // Dispose mesh after short delay (for death animation later)
        setTimeout(() => {
            if (this.mesh) {
                this.mesh.dispose();
                this.mesh = null;
            }
        }, 100);
    }

    /**
     * Stun the enemy for a duration.
     * @param {number} duration - Stun duration in seconds
     */
    stun(duration) {
        this.isStunned = true;
        this.stunDuration = Math.max(this.stunDuration, duration);
        console.log(`${this.cameraTarget.name} stunned for ${duration}s`);
    }

    /**
     * Update stun state.
     * @param {number} deltaTime
     */
    updateStun(deltaTime) {
        if (this.isStunned) {
            this.stunDuration -= deltaTime;
            if (this.stunDuration <= 0) {
                this.isStunned = false;
                this.stunDuration = 0;
                console.log(`${this.cameraTarget.name} recovered from stun`);
            }
        }
    }

    /**
     * Update enemy AI. Override in subclasses.
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Update stun state
        this.updateStun(deltaTime);

        // Subclasses implement AI behavior (should check isStunned)
    }

    /**
     * Get current position.
     * @returns {Vector3}
     */
    getPosition() {
        return this.mesh ? this.mesh.position.clone() : this.position.clone();
    }

    /**
     * Get the camera target for this enemy.
     * @returns {CameraTarget}
     */
    getCameraTarget() {
        return this.cameraTarget;
    }

    /**
     * Check if enemy is alive.
     * @returns {boolean}
     */
    isActive() {
        return this.isAlive && this.mesh && !this.mesh.isDisposed();
    }
}
