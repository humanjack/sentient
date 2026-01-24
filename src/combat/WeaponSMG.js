/**
 * WeaponSMG.js - High fire rate submachine gun.
 * From GAME_SPEC: 15 damage, very fast fire, 45 ammo
 */
import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Weapon } from './Weapon.js';

export class WeaponSMG extends Weapon {
    constructor(options = {}) {
        super({
            name: 'SMG',
            damage: 15,
            fireRate: 80, // Very fast
            maxAmmo: 45,
            reloadTime: 1800,
            ...options,
        });

        this.range = 60; // Medium range
        this.spreadAngle = 3; // Slight spread for realism
    }

    /**
     * Fire the SMG with slight spread.
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

        // Add slight spread
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
            console.log(`SMG hit: ${hit.pickedMesh.name}`);

            if (onHit) {
                onHit(hit, this.damage);
            }

            return {
                hit: true,
                mesh: hit.pickedMesh,
                point: hit.pickedPoint,
                distance: hit.distance,
                damage: this.damage,
            };
        }

        return { hit: false };
    }

    /**
     * Add slight spread to direction.
     * @param {Vector3} direction
     * @returns {Vector3}
     */
    addSpread(direction) {
        const spreadRad = (this.spreadAngle * Math.PI) / 180;

        const angleH = (Math.random() - 0.5) * spreadRad;
        const angleV = (Math.random() - 0.5) * spreadRad;

        const cosH = Math.cos(angleH);
        const sinH = Math.sin(angleH);
        const cosV = Math.cos(angleV);
        const sinV = Math.sin(angleV);

        const newDir = new Vector3(
            direction.x * cosH - direction.z * sinH,
            direction.y * cosV + Math.sqrt(direction.x * direction.x + direction.z * direction.z) * sinV,
            direction.x * sinH + direction.z * cosH
        );

        return newDir.normalize();
    }
}
