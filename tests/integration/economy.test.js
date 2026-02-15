import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../../src/gameflow/ScoreManager.js';

describe('Economy Integration', () => {
    let sm;

    beforeEach(() => { sm = new ScoreManager(); });

    it('earn credits then purchase deducts correctly', () => {
        sm.addCredits(2000);
        expect(sm.credits).toBe(2000);

        // Simulate buying a shotgun ($800)
        const success = sm.spendCredits(800);
        expect(success).toBe(true);
        expect(sm.credits).toBe(1200);

        // Try to buy something too expensive
        const fail = sm.spendCredits(1500);
        expect(fail).toBe(false);
        expect(sm.credits).toBe(1200);
    });
});
