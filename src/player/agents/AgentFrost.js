/**
 * AgentFrost.js - "Frost" agent definition.
 * Ice-themed controller with area denial abilities.
 */
export const AgentFrost = {
    id: 'frost',
    name: 'Frost',
    color: { r: 0.2, g: 0.6, b: 1.0 },
    emissiveColor: { r: 0.1, g: 0.2, b: 0.5 },
    description: 'Ice controller. Slows and freezes enemies.',
    stats: {
        health: 100,
        shield: 75, // More shield, slightly tankier
        moveSpeed: 4.5,
        sprintSpeed: 7.5,
    },
    abilities: {
        Q: {
            name: 'Ice Wall',
            description: 'Creates a wall of ice that blocks movement',
            cooldown: 20,
            key: 'Q',
        },
        E: {
            name: 'Frost Nova',
            description: 'Slows all enemies in a radius around player',
            cooldown: 12,
            key: 'E',
        },
        C: {
            name: 'Ice Shard',
            description: 'Launches a piercing ice projectile',
            cooldown: 10,
            key: 'C',
        },
        X: {
            name: 'Blizzard',
            description: 'Freezes all enemies for 3 seconds',
            chargeKills: 8,
            key: 'X',
            isUltimate: true,
        },
    },
};
