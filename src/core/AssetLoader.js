/**
 * AssetLoader.js - Singleton asset loader with caching and preloading.
 * Loads GLB/glTF models and provides cloning for instancing.
 * Falls back gracefully if models aren't found.
 */
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';

// Asset manifest - all models the game needs
const ASSET_MANIFEST = {
    // Characters
    'player': 'models/characters/player.glb',
    'player_blaze': 'models/characters/player_blaze.glb',
    'player_frost': 'models/characters/player_frost.glb',
    'player_shadow': 'models/characters/player_shadow.glb',

    // Enemies
    'enemy_grunt': 'models/enemies/grunt.glb',
    'enemy_soldier': 'models/enemies/soldier.glb',
    'enemy_sniper': 'models/enemies/sniper.glb',
    'enemy_heavy': 'models/enemies/heavy.glb',
    'enemy_boss': 'models/enemies/boss.glb',

    // Weapons
    'weapon_pistol': 'models/weapons/pistol.glb',
    'weapon_rifle': 'models/weapons/rifle.glb',
    'weapon_smg': 'models/weapons/smg.glb',
    'weapon_sniper_rifle': 'models/weapons/sniper_rifle.glb',
    'weapon_shotgun': 'models/weapons/shotgun.glb',
    'weapon_rocket_launcher': 'models/weapons/rocket_launcher.glb',

    // Environment
    'env_crate': 'models/environment/crate.glb',
    'env_pillar': 'models/environment/pillar.glb',
    'env_wall': 'models/environment/wall.glb',
    'env_barrel': 'models/environment/barrel.glb',
};

export class AssetLoader {
    static _instance = null;

    /**
     * Get the singleton instance.
     * @returns {AssetLoader}
     */
    static getInstance() {
        if (!AssetLoader._instance) {
            AssetLoader._instance = new AssetLoader();
        }
        return AssetLoader._instance;
    }

    /**
     * Reset the singleton (for testing).
     */
    static resetInstance() {
        if (AssetLoader._instance) {
            AssetLoader._instance.dispose();
        }
        AssetLoader._instance = null;
    }

    constructor() {
        /** @type {Map<string, import('@babylonjs/core').AssetContainer>} */
        this._cache = new Map();
        /** @type {Map<string, string>} */
        this._failedAssets = new Map();
        this._scene = null;
        this._loaded = false;
    }

    /**
     * Get the asset manifest.
     * @returns {Object}
     */
    static getManifest() {
        return { ...ASSET_MANIFEST };
    }

    /**
     * Preload all assets in the manifest.
     * @param {import('@babylonjs/core').Scene} scene
     * @param {function} [onProgress] - Callback (loaded, total, assetName)
     * @returns {Promise<void>}
     */
    async preloadAll(scene, onProgress) {
        this._scene = scene;
        const entries = Object.entries(ASSET_MANIFEST);
        const total = entries.length;
        let loaded = 0;

        for (const [key, path] of entries) {
            try {
                await this._loadAsset(key, path, scene);
            } catch (err) {
                console.warn(`AssetLoader: Failed to load "${key}" from "${path}":`, err.message);
                this._failedAssets.set(key, err.message);
            }
            loaded++;
            if (onProgress) {
                onProgress(loaded, total, key);
            }
        }

        this._loaded = true;
        console.log(`AssetLoader: Loaded ${this._cache.size}/${total} assets (${this._failedAssets.size} failed)`);
    }

    /**
     * Load a single asset into the cache.
     * @param {string} key
     * @param {string} path
     * @param {import('@babylonjs/core').Scene} scene
     */
    async _loadAsset(key, path, scene) {
        if (this._cache.has(key)) return;

        // Split path into directory and filename for SceneLoader
        const lastSlash = path.lastIndexOf('/');
        const rootUrl = path.substring(0, lastSlash + 1);
        const filename = path.substring(lastSlash + 1);

        const container = await SceneLoader.LoadAssetContainerAsync(
            rootUrl,
            filename,
            scene
        );

        // Don't add to scene yet - we clone on demand
        this._cache.set(key, container);
    }

    /**
     * Check if an asset is loaded.
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this._cache.has(key);
    }

    /**
     * Check if an asset failed to load.
     * @param {string} key
     * @returns {boolean}
     */
    hasFailed(key) {
        return this._failedAssets.has(key);
    }

    /**
     * Get a clone of a loaded model's root mesh.
     * Returns null if asset not loaded (caller should use geometric fallback).
     * @param {string} key - Asset key from manifest
     * @param {string} [name] - Name for the cloned mesh
     * @returns {import('@babylonjs/core').Mesh|null}
     */
    cloneMesh(key, name) {
        const container = this._cache.get(key);
        if (!container) return null;

        // Instantiate into scene (creates clones of all meshes)
        const entries = container.instantiateModelsToScene(
            (sourceName) => name ? `${name}_${sourceName}` : sourceName
        );

        if (entries.rootNodes.length > 0) {
            return entries.rootNodes[0];
        }
        return null;
    }

    /**
     * Get all loaded asset keys.
     * @returns {string[]}
     */
    getLoadedKeys() {
        return [...this._cache.keys()];
    }

    /**
     * Get all failed asset keys.
     * @returns {string[]}
     */
    getFailedKeys() {
        return [...this._failedAssets.keys()];
    }

    /**
     * Whether preloading has completed.
     * @returns {boolean}
     */
    isLoaded() {
        return this._loaded;
    }

    /**
     * Dispose all cached containers.
     */
    dispose() {
        for (const [, container] of this._cache) {
            container.dispose();
        }
        this._cache.clear();
        this._failedAssets.clear();
        this._loaded = false;
    }
}
