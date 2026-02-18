import { describe, it, expect } from 'vitest';
import { AgentBlaze } from '../../../../src/player/agents/AgentBlaze.js';
import { AgentFrost } from '../../../../src/player/agents/AgentFrost.js';
import { AgentShadow } from '../../../../src/player/agents/AgentShadow.js';

const requiredFields = ['id', 'name', 'color', 'description', 'stats', 'abilities'];

describe('Agents', () => {
    for (const [name, agent] of [['Blaze', AgentBlaze], ['Frost', AgentFrost], ['Shadow', AgentShadow]]) {
        describe(name, () => {
            it('has all required fields', () => {
                for (const f of requiredFields) expect(agent[f]).toBeDefined();
            });
        });
    }

    it('Blaze has 100hp and 50 shield', () => {
        expect(AgentBlaze.stats.health).toBe(100);
        expect(AgentBlaze.stats.shield).toBe(50);
    });

    it('Frost has 75 shield', () => {
        expect(AgentFrost.stats.shield).toBe(75);
    });

    it('Shadow has 80hp and 6 speed', () => {
        expect(AgentShadow.stats.health).toBe(80);
        expect(AgentShadow.stats.moveSpeed).toBe(6);
    });
});
