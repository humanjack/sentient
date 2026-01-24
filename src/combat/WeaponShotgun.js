/**
 * WeaponShotgun.js - Spread damage shotgun.
 * From GAME_SPEC: 15x6 pellets, slow fire, 8 ammo
 */
import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Weapon } from './Weapon.js';

export class WeaponShotgun extends Weapon {
    constructor(options = {}) {
        super({
            name: 'Shotgun',
            damage: 15, // Per pellet
            fireRate: 800, // Slow
            maxAmmo: 8,
            reloadTime: 2000, // Slow reload
            ...options,
        });

        this.range = 30; // Short range
        this.pelletCount = 6;
        this.spreadAngle = 10; // Degrees
    }

    /**
     * Fire the shotgun - 6 pellets in a cone pattern.
     */
    fire(origin, direction, scene, onHit) {
        if (!this.canFire()) {
            if (this.currentAmmo <= 0 && this.onEmpty) {
                this.onEmpty();
            }
            return null;
        }

        this.currentAmmo--;
        this.lastFireTime = performance.now();

        if (this.onFire) {
            this.onFire(this);
        }

        // Fire multiple pellets
        let totalDamage = 0;
        let hitCount = 0;
        let lastHit = null;

        for (let i = 0; i < this.pelletCount; i++) {
            // Add random spread to direction
            const spreadDir = this.addSpread(direction);
            const ray = new Ray(origin, spreadDir, this.range);

            const hit = scene.pickWithRay(ray, (mesh) => {
                const name = mesh.name.toLowerCase();
                if (name === 'ground') return false;
                if (name.includes('wall')) return false;
                if (name.includes('player')) return false;
                if (name.includes('indicator')) return false;
                if (name.includes('spawn')) return false;
                if (name.includes('seccam')) return false;
                if (name.includes('crate')) return false;
                if (name.includes('pillar')) return false;
                return true;
            });

            if (hit && hit.hit) {
                hitCount++;
                totalDamage += this.damage;
                lastHit = hit;

                // Call onHit for each pellet that connects
                if (onHit) {
                    onHit(hit, this.damage);
                }
            }
        }

        if (hitCount > 0) {
            console.log(`Shotgun hit: ${hitCount}/${this.pelletCount} pellets, ${totalDamage} total damage`);
            return {
                hit: true,
                mesh: lastHit.pickedMesh,
                point: lastHit.pickedPoint,
                pelletHits: hitCount,
                totalDamage: totalDamage,
            };
        }

        console.log('Shotgun blast missed');
        return { hit: false };
    }

    /**
     * Add random spread to a direction vector.
     * @param {Vector3} direction - Base direction
     * @returns {Vector3} - Direction with spread applied
     */
    addSpread(direction) {
        const spreadRad = (this.spreadAngle * Math.PI) / 180;

        // Random angles within spread cone
        const angleH = (Math.random() - 0.5) * spreadRad;
        const angleV = (Math.random() - 0.5) * spreadRad;

        // Create rotation from angles
        const cosH = Math.cos(angleH);
        const sinH = Math.sin(angleH);
        const cosV = Math.cos(angleV);
        const sinV = Math.sin(angleV);

        // Apply rotations to direction
        const newDir = new Vector3(
            direction.x * cosH - direction.z * sinH,
            direction.y * cosV + Math.sqrt(direction.x * direction.x + direction.z * direction.z) * sinV,
            direction.x * sinH + direction.z * cosH
        );

        return newDir.normalize();
    }
}
