/**
 * DamageSystem.js - Handles damage processing and enemy lookups.
 * Connects mesh hits to enemy objects.
 */
export class DamageSystem {
    constructor() {
        // Map of mesh names to enemy objects
        this.enemyMeshMap = new Map();
    }

    /**
     * Register an enemy's mesh for damage detection.
     * @param {Mesh} mesh - The enemy's mesh
     * @param {EnemyBase} enemy - The enemy object
     */
    registerEnemy(mesh, enemy) {
        this.enemyMeshMap.set(mesh.name, enemy);
        // Also store on mesh for easy access
        mesh.enemyRef = enemy;
    }

    /**
     * Unregister an enemy (when they die).
     * @param {Mesh} mesh - The enemy's mesh
     */
    unregisterEnemy(mesh) {
        if (mesh) {
            this.enemyMeshMap.delete(mesh.name);
        }
    }

    /**
     * Process a hit from a weapon.
     * @param {PickingInfo} pickResult - Babylon.js pick result
     * @param {number} damage - Damage amount
     * @returns {boolean} True if an enemy was hit
     */
    processHit(pickResult, damage) {
        if (!pickResult || !pickResult.hit || !pickResult.pickedMesh) {
            return false;
        }

        const mesh = pickResult.pickedMesh;

        // Check if mesh has enemy reference
        if (mesh.enemyRef && mesh.enemyRef.isAlive) {
            mesh.enemyRef.takeDamage(damage);
            return true;
        }

        // Check parent mesh (in case we hit a child like the eye)
        if (mesh.parent && mesh.parent.enemyRef && mesh.parent.enemyRef.isAlive) {
            mesh.parent.enemyRef.takeDamage(damage);
            return true;
        }

        // Check by name in map
        const enemy = this.enemyMeshMap.get(mesh.name);
        if (enemy && enemy.isAlive) {
            enemy.takeDamage(damage);
            return true;
        }

        return false;
    }

    /**
     * Process AOE (area of effect) damage at a position.
     * @param {Vector3} center - Explosion center
     * @param {number} damage - Max damage at center
     * @param {number} radius - Blast radius
     * @returns {number} Number of enemies hit
     */
    processAOE(center, damage, radius) {
        let hitCount = 0;

        for (const enemy of this.enemyMeshMap.values()) {
            if (!enemy.isAlive || !enemy.mesh) continue;

            const dist = Math.sqrt(
                Math.pow(enemy.mesh.position.x - center.x, 2) +
                Math.pow(enemy.mesh.position.z - center.z, 2)
            );

            if (dist <= radius) {
                // Damage falls off with distance
                const falloff = 1 - (dist / radius);
                const actualDamage = Math.floor(damage * Math.max(0.3, falloff));
                enemy.takeDamage(actualDamage);
                hitCount++;
            }
        }

        return hitCount;
    }

    /**
     * Get enemy from mesh.
     * @param {Mesh} mesh
     * @returns {EnemyBase|null}
     */
    getEnemyFromMesh(mesh) {
        if (mesh.enemyRef) return mesh.enemyRef;
        if (mesh.parent && mesh.parent.enemyRef) return mesh.parent.enemyRef;
        return this.enemyMeshMap.get(mesh.name) || null;
    }
}
