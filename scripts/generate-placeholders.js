/**
 * Generate placeholder GLB files for the game.
 * Creates minimal valid GLB files with colored geometries.
 * 
 * GLB format: 12-byte header + JSON chunk + BIN chunk
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const MODELS_DIR = join(import.meta.dirname, '..', 'public', 'models');

// Ensure directories exist
['characters', 'enemies', 'weapons', 'environment'].forEach(dir => {
    mkdirSync(join(MODELS_DIR, dir), { recursive: true });
});

/**
 * Create a minimal valid GLB file with a colored box mesh.
 */
function createGLB(color = [0.5, 0.5, 0.5, 1.0], scaleX = 1, scaleY = 1, scaleZ = 1) {
    // Box vertices (8 corners, with normals = 24 unique vertices for flat shading)
    // Simplified: just use a box with 24 vertices (4 per face, 6 faces)
    const positions = [];
    const normals = [];
    const indices = [];
    
    const hx = scaleX / 2, hy = scaleY / 2, hz = scaleZ / 2;
    
    // Face definitions: [normal, corners]
    const faces = [
        // Front (+Z)
        { n: [0, 0, 1], v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
        // Back (-Z)
        { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] },
        // Top (+Y)
        { n: [0, 1, 0], v: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]] },
        // Bottom (-Y)
        { n: [0, -1, 0], v: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]] },
        // Right (+X)
        { n: [1, 0, 0], v: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]] },
        // Left (-X)
        { n: [-1, 0, 0], v: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]] },
    ];
    
    let vertexIndex = 0;
    for (const face of faces) {
        for (const v of face.v) {
            positions.push(...v);
            normals.push(...face.n);
        }
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
        indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 3);
        vertexIndex += 4;
    }
    
    // Create binary buffer
    const posBuffer = new Float32Array(positions);
    const normBuffer = new Float32Array(normals);
    const idxBuffer = new Uint16Array(indices);
    
    const posBytes = posBuffer.buffer;
    const normBytes = normBuffer.buffer;
    const idxBytes = idxBuffer.buffer;
    
    const totalBinSize = posBytes.byteLength + normBytes.byteLength + idxBytes.byteLength;
    // Pad to 4-byte alignment
    const paddedBinSize = Math.ceil(totalBinSize / 4) * 4;
    
    const binBuffer = new ArrayBuffer(paddedBinSize);
    const binView = new Uint8Array(binBuffer);
    
    let offset = 0;
    binView.set(new Uint8Array(idxBytes), offset);
    const idxOffset = offset;
    const idxLength = idxBytes.byteLength;
    offset += idxBytes.byteLength;
    
    binView.set(new Uint8Array(posBytes), offset);
    const posOffset = offset;
    const posLength = posBytes.byteLength;
    offset += posBytes.byteLength;
    
    binView.set(new Uint8Array(normBytes), offset);
    const normOffset = offset;
    const normLength = normBytes.byteLength;
    
    // Compute min/max for positions
    let minPos = [Infinity, Infinity, Infinity];
    let maxPos = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
        for (let j = 0; j < 3; j++) {
            minPos[j] = Math.min(minPos[j], positions[i + j]);
            maxPos[j] = Math.max(maxPos[j], positions[i + j]);
        }
    }
    
    const gltf = {
        asset: { version: "2.0", generator: "enemy-eyes-placeholder" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name: "Placeholder" }],
        meshes: [{
            primitives: [{
                attributes: {
                    POSITION: 1,
                    NORMAL: 2
                },
                indices: 0,
                material: 0
            }]
        }],
        materials: [{
            pbrMetallicRoughness: {
                baseColorFactor: color,
                metallicFactor: 0.1,
                roughnessFactor: 0.8
            },
            name: "PlaceholderMat"
        }],
        accessors: [
            { bufferView: 0, componentType: 5123, count: indices.length, type: "SCALAR" },
            { bufferView: 1, componentType: 5126, count: positions.length / 3, type: "VEC3", min: minPos, max: maxPos },
            { bufferView: 2, componentType: 5126, count: normals.length / 3, type: "VEC3" }
        ],
        bufferViews: [
            { buffer: 0, byteOffset: idxOffset, byteLength: idxLength, target: 34963 },
            { buffer: 0, byteOffset: posOffset, byteLength: posLength, target: 34962 },
            { buffer: 0, byteOffset: normOffset, byteLength: normLength, target: 34962 }
        ],
        buffers: [{ byteLength: paddedBinSize }]
    };
    
    const jsonStr = JSON.stringify(gltf);
    // Pad JSON to 4-byte alignment
    const jsonPadded = jsonStr + ' '.repeat((4 - (jsonStr.length % 4)) % 4);
    const jsonBytes = new TextEncoder().encode(jsonPadded);
    
    // GLB structure
    const headerSize = 12;
    const jsonChunkHeader = 8;
    const binChunkHeader = 8;
    const totalSize = headerSize + jsonChunkHeader + jsonBytes.byteLength + binChunkHeader + paddedBinSize;
    
    const glb = new ArrayBuffer(totalSize);
    const view = new DataView(glb);
    
    // Header
    view.setUint32(0, 0x46546C67, true); // magic "glTF"
    view.setUint32(4, 2, true); // version
    view.setUint32(8, totalSize, true); // total length
    
    // JSON chunk
    let pos2 = 12;
    view.setUint32(pos2, jsonBytes.byteLength, true); pos2 += 4;
    view.setUint32(pos2, 0x4E4F534A, true); pos2 += 4; // "JSON"
    new Uint8Array(glb).set(jsonBytes, pos2); pos2 += jsonBytes.byteLength;
    
    // BIN chunk
    view.setUint32(pos2, paddedBinSize, true); pos2 += 4;
    view.setUint32(pos2, 0x004E4942, true); pos2 += 4; // "BIN\0"
    new Uint8Array(glb).set(binView, pos2);
    
    return Buffer.from(glb);
}

// Define all models to generate
const models = {
    'characters/player.glb': { color: [0.2, 0.6, 1.0, 1.0], scale: [1, 2, 1] },
    'characters/player_blaze.glb': { color: [1.0, 0.3, 0.1, 1.0], scale: [1, 2, 1] },
    'characters/player_frost.glb': { color: [0.3, 0.7, 1.0, 1.0], scale: [1, 2, 1] },
    'characters/player_shadow.glb': { color: [0.2, 0.2, 0.3, 1.0], scale: [1, 2, 1] },
    'enemies/grunt.glb': { color: [0.8, 0.2, 0.2, 1.0], scale: [1, 2, 1] },
    'enemies/soldier.glb': { color: [0.2, 0.3, 0.8, 1.0], scale: [1, 2, 1] },
    'enemies/sniper.glb': { color: [0.8, 0.8, 0.2, 1.0], scale: [1, 2, 1] },
    'enemies/heavy.glb': { color: [0.5, 0.1, 0.1, 1.0], scale: [2, 3, 2] },
    'enemies/boss.glb': { color: [0.6, 0.1, 0.6, 1.0], scale: [3, 4, 3] },
    'weapons/pistol.glb': { color: [0.3, 0.3, 0.3, 1.0], scale: [0.2, 0.3, 0.5] },
    'weapons/rifle.glb': { color: [0.4, 0.35, 0.3, 1.0], scale: [0.15, 0.2, 0.8] },
    'weapons/smg.glb': { color: [0.35, 0.35, 0.35, 1.0], scale: [0.15, 0.2, 0.6] },
    'weapons/sniper_rifle.glb': { color: [0.25, 0.3, 0.25, 1.0], scale: [0.12, 0.15, 1.0] },
    'weapons/shotgun.glb': { color: [0.5, 0.35, 0.2, 1.0], scale: [0.15, 0.2, 0.7] },
    'weapons/rocket_launcher.glb': { color: [0.3, 0.4, 0.3, 1.0], scale: [0.25, 0.25, 0.9] },
    'environment/crate.glb': { color: [0.5, 0.4, 0.3, 1.0], scale: [2, 2, 2] },
    'environment/pillar.glb': { color: [0.35, 0.35, 0.4, 1.0], scale: [2, 5, 2] },
    'environment/wall.glb': { color: [0.4, 0.35, 0.3, 1.0], scale: [10, 5, 1] },
    'environment/barrel.glb': { color: [0.3, 0.4, 0.3, 1.0], scale: [1, 1.5, 1] },
};

let count = 0;
for (const [path, config] of Object.entries(models)) {
    const glb = createGLB(config.color, ...config.scale);
    writeFileSync(join(MODELS_DIR, path), glb);
    count++;
}

console.log(`Generated ${count} placeholder GLB models in public/models/`);
