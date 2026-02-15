import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DamageSystem } from '../../../src/combat/DamageSystem.js';

describe('DamageSystem', () => {
    let ds;
    const makeEnemy = (name, x=0, z=0) => ({ isAlive:true, hp:100, takeDamage:vi.fn(function(d){this.hp-=d;}), mesh:{name,position:{x,y:0,z}} });
    const makeMesh = (name) => ({ name, enemyRef:null, parent:null });

    beforeEach(() => { ds = new DamageSystem(); });

    it('registerEnemy and getEnemyFromMesh', () => {
        const e = makeEnemy('e1'), m = makeMesh('e1'); m.enemyRef = e;
        ds.registerEnemy(m, e); expect(ds.getEnemyFromMesh(m)).toBe(e);
    });
    it('unregisterEnemy', () => {
        const m = makeMesh('e1'); ds.registerEnemy(m, makeEnemy('e1'));
        ds.unregisterEnemy(m); expect(ds.enemyMeshMap.has('e1')).toBe(false);
    });

    describe('processHit', () => {
        it('direct hit via enemyRef', () => {
            const e = makeEnemy('e1'), m = makeMesh('e1'); m.enemyRef = e;
            ds.registerEnemy(m, e);
            expect(ds.processHit({hit:true,pickedMesh:m}, 25)).toBe(true);
            expect(e.takeDamage).toHaveBeenCalledWith(25);
        });
        it('parent mesh hit', () => {
            const e = makeEnemy('p'), p = makeMesh('p'); p.enemyRef = e;
            const c = makeMesh('c'); c.parent = p;
            expect(ds.processHit({hit:true,pickedMesh:c}, 10)).toBe(true);
        });
        it('by name in map', () => {
            const e = makeEnemy('e1'), m = makeMesh('e1'); ds.registerEnemy(m, e);
            expect(ds.processHit({hit:true,pickedMesh:makeMesh('e1')}, 30)).toBe(true);
        });
        it('returns false on miss', () => {
            expect(ds.processHit(null, 10)).toBe(false);
        });
    });

    describe('processAOE', () => {
        it('damages enemies in radius with falloff', () => {
            const e1=makeEnemy('e1',0,0), e2=makeEnemy('e2',5,0), e3=makeEnemy('e3',20,0);
            ds.enemyMeshMap.set('e1',e1); ds.enemyMeshMap.set('e2',e2); ds.enemyMeshMap.set('e3',e3);
            const count = ds.processAOE({x:0,y:0,z:0}, 100, 10);
            expect(count).toBe(2);
            expect(e1.takeDamage).toHaveBeenCalled();
            expect(e2.takeDamage).toHaveBeenCalled();
            expect(e3.takeDamage).not.toHaveBeenCalled();
            expect(e1.takeDamage.mock.calls[0][0]).toBe(100);
            expect(e2.takeDamage.mock.calls[0][0]).toBeLessThan(100);
        });
    });
});
