import { describe, it, expect, vi } from 'vitest';
import { Weapon } from '../../src/combat/Weapon.js';
import { DamageSystem } from '../../src/combat/DamageSystem.js';

describe('Combat Flow Integration', () => {
    it('fire weapon → processHit → enemy takes damage', () => {
        vi.spyOn(performance, 'now').mockReturnValue(1000);
        const weapon = new Weapon({ damage: 40, fireRate: 100, maxAmmo: 10 });
        const ds = new DamageSystem();
        const enemy = { isAlive:true, hp:100, takeDamage:vi.fn(function(d){this.hp-=d;}), mesh:{name:'e1',position:{x:0,y:0,z:0}} };
        const mesh = { name:'e1', enemyRef:enemy, parent:null };
        ds.registerEnemy(mesh, enemy);
        weapon.fire();
        expect(weapon.currentAmmo).toBe(9);
        expect(ds.processHit({hit:true,pickedMesh:mesh}, weapon.damage)).toBe(true);
        expect(enemy.hp).toBe(60);
    });
});
