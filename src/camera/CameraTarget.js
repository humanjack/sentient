/**
 * CameraTarget.js - Represents a position the second-person camera can attach to.
 * Can be a fixed point (security camera) or attached to a moving mesh (enemy).
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class CameraTarget {
    /**
     * Create a camera target.
     * @param {Object} options
     * @param {Vector3} options.position - Fixed position (used if no mesh attached)
     * @param {Mesh} options.mesh - Optional mesh to follow (for enemies)
     * @param {number} options.priority - Lower = more preferred (enemies=1, security=2)
     * @param {string} options.name - Identifier for debugging
     * @param {Vector3} options.offset - Offset from mesh position (e.g., eye height)
     */
    constructor(options = {}) {
        this.position = options.position || new Vector3(0, 5, 0);
        this.mesh = options.mesh || null;
        this.priority = options.priority || 2;
        this.name = options.name || 'CameraTarget';
        this.offset = options.offset || new Vector3(0, 1.5, 0); // Default eye height
        this.isActive = true;
    }

    /**
     * Get the current world position of this target.
     * If attached to a mesh, returns mesh position + offset.
     * Otherwise returns the fixed position.
     * @returns {Vector3}
     */
    getPosition() {
        if (this.mesh && this.isActive) {
            // Return mesh position plus offset (e.g., enemy eye level)
            return this.mesh.position.add(this.offset);
        }
        return this.position.clone();
    }

    /**
     * Check if this target is valid and active.
     * @returns {boolean}
     */
    isValid() {
        if (!this.isActive) return false;
        if (this.mesh && this.mesh.isDisposed && this.mesh.isDisposed()) return false;
        return true;
    }

    /**
     * Deactivate this target (e.g., when enemy dies).
     */
    deactivate() {
        this.isActive = false;
    }

    /**
     * Activate this target.
     */
    activate() {
        this.isActive = true;
    }
}
