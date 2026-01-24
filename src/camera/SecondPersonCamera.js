/**
 * SecondPersonCamera.js - The core unique mechanic!
 * Camera that views the player from enemy/security camera perspectives.
 * Always looks AT the player, never controlled by player directly.
 */
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class SecondPersonCamera {
    /**
     * Create the second-person camera system.
     * @param {Scene} scene - Babylon.js scene
     * @param {function} getPlayerPosition - Function that returns player's current position
     */
    constructor(scene, getPlayerPosition) {
        this.scene = scene;
        this.getPlayerPosition = getPlayerPosition;

        // Create the actual camera
        this.camera = new FreeCamera('secondPersonCamera', new Vector3(0, 10, -10), scene);
        this.camera.minZ = 0.1; // Near clip plane

        // Array of all registered camera targets
        this.targets = [];

        // Currently active target
        this.currentTarget = null;

        // Smooth transition settings
        this.transitionSpeed = 3.0; // How fast camera moves to new position
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.previousPosition = new Vector3();

        // How often to check for better target (seconds)
        this.targetCheckInterval = 0.5;
        this.timeSinceTargetCheck = 0;

        console.log('SecondPersonCamera initialized');
    }

    /**
     * Register a new camera target.
     * @param {CameraTarget} target
     */
    registerTarget(target) {
        if (!this.targets.includes(target)) {
            this.targets.push(target);
            console.log(`Registered camera target: ${target.name} (priority: ${target.priority})`);

            // If no current target, use this one
            if (!this.currentTarget) {
                this.setTarget(target);
            }
        }
    }

    /**
     * Unregister a camera target (e.g., when enemy dies).
     * @param {CameraTarget} target
     */
    unregisterTarget(target) {
        const index = this.targets.indexOf(target);
        if (index !== -1) {
            this.targets.splice(index, 1);
            console.log(`Unregistered camera target: ${target.name}`);

            // If this was the current target, find a new one
            if (this.currentTarget === target) {
                this.findBestTarget();
            }
        }
    }

    /**
     * Called when a target is destroyed (e.g., enemy killed).
     * Removes target and smoothly transitions to next best target.
     * @param {CameraTarget} target
     */
    onTargetDestroyed(target) {
        target.deactivate();
        this.unregisterTarget(target);
    }

    /**
     * Find the best available target based on priority and distance to player.
     * Lower priority = preferred. Among same priority, closer to player wins.
     * @returns {CameraTarget|null}
     */
    findBestTarget() {
        const playerPos = this.getPlayerPosition();
        let bestTarget = null;
        let bestScore = Infinity;

        for (const target of this.targets) {
            if (!target.isValid()) continue;

            // Score = priority * 1000 + distance
            // This way priority always wins, distance is tiebreaker
            const distance = Vector3.Distance(target.getPosition(), playerPos);
            const score = target.priority * 1000 + distance;

            if (score < bestScore) {
                bestScore = score;
                bestTarget = target;
            }
        }

        if (bestTarget && bestTarget !== this.currentTarget) {
            this.setTarget(bestTarget);
        }

        return bestTarget;
    }

    /**
     * Set the current camera target with smooth transition.
     * @param {CameraTarget} target
     */
    setTarget(target) {
        if (this.currentTarget) {
            // Start transition from current position
            this.previousPosition = this.camera.position.clone();
            this.isTransitioning = true;
            this.transitionProgress = 0;
        }

        this.currentTarget = target;
        console.log(`Camera switched to: ${target.name}`);
    }

    /**
     * Update camera position and rotation. Call every frame.
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.currentTarget) {
            this.findBestTarget();
            return;
        }

        // Periodically check for better target
        this.timeSinceTargetCheck += deltaTime;
        if (this.timeSinceTargetCheck >= this.targetCheckInterval) {
            this.timeSinceTargetCheck = 0;
            this.findBestTarget();
        }

        // Get target position
        const targetPos = this.currentTarget.getPosition();

        // Handle smooth transition
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime * this.transitionSpeed;

            if (this.transitionProgress >= 1) {
                // Transition complete
                this.isTransitioning = false;
                this.camera.position = targetPos;
            } else {
                // Lerp between previous and new position
                this.camera.position = Vector3.Lerp(
                    this.previousPosition,
                    targetPos,
                    this.smoothStep(this.transitionProgress)
                );
            }
        } else {
            // No transition, follow target directly (for moving enemies)
            this.camera.position = targetPos;
        }

        // Always look at the player
        const playerPos = this.getPlayerPosition();
        // Look at player's chest height, not feet
        const lookTarget = new Vector3(playerPos.x, playerPos.y + 1, playerPos.z);
        this.camera.setTarget(lookTarget);
    }

    /**
     * Smooth step function for nicer transitions.
     * @param {number} t - Value between 0 and 1
     * @returns {number}
     */
    smoothStep(t) {
        return t * t * (3 - 2 * t);
    }

    /**
     * Get the Babylon.js camera object.
     * @returns {FreeCamera}
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get the current target.
     * @returns {CameraTarget|null}
     */
    getCurrentTarget() {
        return this.currentTarget;
    }

    /**
     * Force immediate switch to a specific target (no transition).
     * @param {CameraTarget} target
     */
    forceTarget(target) {
        this.currentTarget = target;
        this.isTransitioning = false;
        this.camera.position = target.getPosition();
    }
}
