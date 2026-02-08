/**
 * AgentShadow.js - "Shadow" agent definition.
 * Stealth-themed agent with evasion abilities.
 */
export const AgentShadow = {
    id: 'shadow',
    name: 'Shadow',
    color: { r: 0.5, g: 0.1, b: 0.7 },
    emissiveColor: { r: 0.2, g: 0.05, b: 0.3 },
    description: 'Stealth assassin. Strikes from the shadows.',
    stats: {
        health: 80,  // Glass cannon - less health
        shield: 50,
        moveSpeed: 6,  // Faster
        sprintSpeed: 9.5,
    },
    abilities: {
        Q: {
            name: 'Smoke Bomb',
            description: 'Creates a dark cloud that hides the player',
            cooldown: 15,
            key: 'Q',
        },
        E: {
            name: 'Blink',
            description: 'Teleport a short distance forward',
            cooldown: 6,
            key: 'E',
        },
        C: {
            name: 'Shadow Strike',
            description: 'Next shot deals 2x damage',
            cooldown: 18,
            key: 'C',
        },
        X: {
            name: 'Phantom',
            description: 'Become invisible and gain speed for 5 seconds',
            chargeKills: 12,
            key: 'X',
            isUltimate: true,
        },
    },
};
