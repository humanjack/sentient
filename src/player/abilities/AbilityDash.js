/**
 * AbilityDash.js - Quick dash ability with brief invincibility.
 * Key: E, Cooldown: 8 seconds
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Ability } from './Ability.js';

export class AbilityDash extends Ability {
    constructor() {
        super({
            name: 'Dash',
            cooldown: 8,
            key: 'E',
        });

        this.dashDistance = 5;
        this.invincibilityDuration = 0.2; // seconds
    }

    /**
     * Execute dash ability.
     * @param {Object} context
     * @returns {boolean}
     */
    execute(context) {
        if (!this.canUse()) {
            return false;
        }

        const { playerPosition, playerDirection, scene, playerHealth, setPlayerPosition } = context;

        // Calculate dash direction (use player direction or forward)
        let dashDir = playerDirection.clone();
        if (dashDir.length() < 0.1) {
            dashDir = new Vector3(0, 0, 1); // Default forward
        }
        dashDir.y = 0; // Keep horizontal
        dashDir.normalize();

        // Calculate new position
        const startPos = playerPosition.clone();
        const endPos = startPos.add(dashDir.scale(this.dashDistance));

        // Clamp to arena bounds
        endPos.x = Math.max(-23, Math.min(23, endPos.x));
        endPos.z = Math.max(-23, Math.min(23, endPos.z));

        // Move player
        if (setPlayerPosition) {
            setPlayerPosition(endPos);
        }

        // Create trail effect
        this.createTrailEffect(startPos, endPos, scene);

        // Brief invincibility
        if (playerHealth) {
            playerHealth.setInvincible(true);
            setTimeout(() => {
                playerHealth.setInvincible(false);
            }, this.invincibilityDuration * 1000);
        }

        console.log('DASH!');

        this.startCooldown();
        return true;
    }

    /**
     * Create visual trail effect.
     * @param {Vector3} start
     * @param {Vector3} end
     * @param {Scene} scene
     */
    createTrailEffect(start, end, scene) {
        const trailCount = 5;
        const trails = [];

        for (let i = 0; i < trailCount; i++) {
            const t = i / (trailCount - 1);
            const pos = Vector3.Lerp(start, end, t);
            pos.y = 1;

            const trail = MeshBuilder.CreateSphere(`dashTrail_${i}`, { diameter: 0.5 }, scene);
            trail.position = pos;

            const mat = new StandardMaterial(`dashTrailMat_${i}`, scene);
            mat.emissiveColor = new Color3(0.2, 0.6, 1.0);
            mat.alpha = 0.7 - (t * 0.5);
            mat.disableLighting = true;
            trail.material = mat;

            trails.push({ mesh: trail, mat });
        }

        // Fade out and dispose
        let elapsed = 0;
        const fadeTime = 300;

        const fadeInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / fadeTime;

            trails.forEach((t, i) => {
                t.mat.alpha = (0.7 - (i / trailCount * 0.5)) * (1 - progress);
            });

            if (elapsed >= fadeTime) {
                clearInterval(fadeInterval);
                trails.forEach(t => {
                    if (t.mat) t.mat.dispose();
                    t.mesh.dispose();
                });
            }
        }, 16);
    }
}
