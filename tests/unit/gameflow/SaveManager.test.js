import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../../src/gameflow/SaveManager.js';

describe('SaveManager', () => {
    let sm;

    beforeEach(() => {
        // jsdom localStorage mock
        const store = {};
        global.localStorage = {
            getItem: (k) => store[k] ?? null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; },
            clear: () => { for (const k in store) delete store[k]; },
        };
        SaveManager.instance = null;
        sm = SaveManager.getInstance();
    });

    it('saveHighScore stores new high', () => {
        const result = sm.saveHighScore(1000, 5);
        expect(result).toBe(true);
    });

    it('loadHighScore returns saved data', () => {
        sm.saveHighScore(2000, 10);
        const data = sm.loadHighScore();
        expect(data.score).toBe(2000);
        expect(data.wave).toBe(10);
    });

    it('loadHighScore returns 0 when empty', () => {
        const data = sm.loadHighScore();
        expect(data.score).toBe(0);
        expect(data.wave).toBe(0);
    });

    it('does not overwrite higher score', () => {
        sm.saveHighScore(5000, 15);
        sm.saveHighScore(3000, 10);
        const data = sm.loadHighScore();
        expect(data.score).toBe(5000);
        expect(data.wave).toBe(15);
    });
});
