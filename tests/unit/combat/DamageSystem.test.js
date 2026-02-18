import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DamageSystem } from '../../../src/combat/DamageSystem.js';

describe('DamageSystem', () => {
    let ds;
    const makeEnemy = (name, x = 0, z = 0) => ({
        isAlive: true,
        hp: 100,
        takeDamage: vi.fn(function(d) { this.hp -= d; }),
        mesh: { name, position: { x, y: 0, z } }
    });
    const makeMesh = (name) => ({ name, enemyRef: null, parent: null });

    beforeEach(() => { ds = new DamageSystem(); });

    it('registerEnemy and getEnemyFromMesh', () => {
        const enemy = makeEnemy('e1');
        const mesh = makeMesh('e1');
        mesh.enemyRef = enemy;
        ds.registerEnemy(mesh, enemy);
        expect(ds.getEnemyFromMesh(mesh)).toBe(enemy);
    });

    it('unregisterEnemy', () => {
        const mesh = makeMesh('e1');
        ds.registerEnemy(mesh, makeEnemy('e1'));
        ds.unregisterEnemy(mesh);
        expect(ds.enemyMeshMap.has('e1')).toBe(false);
    });

    describe('processHit', () => {
        it('direct hit via enemyRef', () => {
            const enemy = makeEnemy('e1');
            const mesh = makeMesh('e1');
            mesh.enemyRef = enemy;
            ds.registerEnemy(mesh, enemy);
            const result = ds.processHit({ hit: true, pickedMesh: mesh }, 25);
            expect(result).toBe(true);
            expect(enemy.takeDamage).toHaveBeenCalledWith(25);
        });

        it('parent mesh hit', () => {
            const enemy = makeEnemy('parent');
            const parent = makeMesh('parent');
            parent.enemyRef = enemy;
            const child = makeMesh('child');
            child.parent = parent;
            const result = ds.processHit({ hit: true, pickedMesh: child }, 10);
            expect(result).toBe(true);
            expect(enemy.takeDamage).toHaveBeenCalledWith(10);
        });

        it('by name in map', () => {
            const enemy = makeEnemy('e1');
            const mesh = makeMesh('e1');
            ds.registerEnemy(mesh, enemy);
            // Create a new mesh object without enemyRef but same name
            const hitMesh = makeMesh('e1');
            const result = ds.processHit({ hit: true, pickedMesh: hitMesh }, 30);
            expect(result).toBe(true);
        });

        it('returns false on miss', () => {
            expect(ds.processHit(null, 10)).toBe(false);
            expect(ds.processHit({ hit: false, pickedMesh: null }, 10)).toBe(false);
        });
    });

    describe('processAOE', () => {
        it('damages enemies in radius with falloff', () => {
            const e1 = makeEnemy('e1', 0, 0);
            const e2 = makeEnemy('e2', 5, 0);
            const e3 = makeEnemy('e3', 20, 0); // out of range
            ds.registerEnemy(makeMesh('e1'), e1);
            ds.registerEnemy(makeMesh('e2'), e2);
            ds.registerEnemy(makeMesh('e3'), e3);

            // Assign mesh refs for position lookup
            ds.enemyMeshMap.set('e1', e1);
            ds.enemyMeshMap.set('e2', e2);
            ds.enemyMeshMap.set('e3', e3);

            const count = ds.processAOE({ x: 0, y: 0, z: 0 }, 100, 10);
            expect(count).toBe(2);
            expect(e1.takeDamage).toHaveBeenCalled();
            expect(e2.takeDamage).toHaveBeenCalled();
            expect(e3.takeDamage).not.toHaveBeenCalled();
            // e1 at center gets full damage, e2 at dist 5 gets reduced
            expect(e1.takeDamage.mock.calls[0][0]).toBe(100);
            expect(e2.takeDamage.mock.calls[0][0]).toBeLessThan(100);
        });
    });
});
