import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../../src/gameflow/SaveManager.js';

describe('SaveManager', () => {
    let sm;
    beforeEach(() => {
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

    it('saveHighScore stores new high', () => { expect(sm.saveHighScore(1000, 5)).toBe(true); });
    it('loadHighScore returns saved data', () => { sm.saveHighScore(2000, 10); const d = sm.loadHighScore(); expect(d.score).toBe(2000); expect(d.wave).toBe(10); });
    it('loadHighScore returns 0 when empty', () => { const d = sm.loadHighScore(); expect(d.score).toBe(0); expect(d.wave).toBe(0); });
    it('does not overwrite higher score', () => {
        sm.saveHighScore(5000, 15); sm.saveHighScore(3000, 10);
        const d = sm.loadHighScore(); expect(d.score).toBe(5000); expect(d.wave).toBe(15);
    });
});
