/**
 * PlayerCamera.js - Third-person camera that follows the player.
 */
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class PlayerCamera {
    /**
     * Create player-following camera.
     * @param {Scene} scene - Babylon.js scene
     * @param {function} getPlayerPosition - Function returning player position
     */
    constructor(scene, getPlayerPosition) {
        this.scene = scene;
        this.getPlayerPosition = getPlayerPosition;

        // Camera offset from player (behind and above)
        this.offset = new Vector3(0, 8, -12);

        // Look ahead distance
        this.lookAheadDistance = 10;

        // Create the camera
        this.camera = new UniversalCamera('playerCamera', new Vector3(0, 10, -15), scene);
        this.camera.minZ = 0.1;
        this.camera.maxZ = 500;

        // Set as active camera
        scene.activeCamera = this.camera;

        console.log('PlayerCamera initialized - third-person view');
    }

    /**
     * Get the camera instance.
     * @returns {UniversalCamera}
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Register a target (kept for API compatibility with GameManager).
     * @param {CameraTarget} target
     */
    registerTarget(target) {
        // No-op for player camera - we don't track enemy targets
    }

    /**
     * Handle target destroyed (kept for API compatibility).
     * @param {CameraTarget} target
     */
    onTargetDestroyed(target) {
        // No-op for player camera
    }

    /**
     * Update camera position to follow player.
     * @param {number} deltaTime
     */
    update(deltaTime) {
        const playerPos = this.getPlayerPosition();

        // Position camera behind and above player
        const targetCameraPos = playerPos.add(this.offset);

        // Smooth camera follow
        this.camera.position = Vector3.Lerp(
            this.camera.position,
            targetCameraPos,
            Math.min(1, deltaTime * 5)
        );

        // Look at a point ahead of the player (or just at the player)
        const lookTarget = playerPos.add(new Vector3(0, 1, this.lookAheadDistance));
        this.camera.setTarget(lookTarget);
    }
}
