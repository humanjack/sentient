/**
 * Tests for AssetLoader singleton, caching, and fallback behavior.
 * Note: These are unit tests that mock Babylon.js dependencies.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Babylon.js modules before importing AssetLoader
vi.mock('@babylonjs/core/Loading/sceneLoader', () => {
    return {
        SceneLoader: {
            LoadAssetContainerAsync: vi.fn(),
        },
    };
});

vi.mock('@babylonjs/loaders/glTF', () => ({}));

import { AssetLoader } from '../src/core/AssetLoader.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

describe('AssetLoader', () => {
    beforeEach(() => {
        AssetLoader.resetInstance();
        vi.clearAllMocks();
    });

    it('should be a singleton', () => {
        const a = AssetLoader.getInstance();
        const b = AssetLoader.getInstance();
        expect(a).toBe(b);
    });

    it('should reset singleton', () => {
        const a = AssetLoader.getInstance();
        AssetLoader.resetInstance();
        const b = AssetLoader.getInstance();
        expect(a).not.toBe(b);
    });

    it('should have a manifest with expected keys', () => {
        const manifest = AssetLoader.getManifest();
        expect(manifest).toHaveProperty('player');
        expect(manifest).toHaveProperty('enemy_grunt');
        expect(manifest).toHaveProperty('weapon_pistol');
        expect(manifest).toHaveProperty('env_crate');
    });

    it('should report not loaded before preload', () => {
        const loader = AssetLoader.getInstance();
        expect(loader.isLoaded()).toBe(false);
        expect(loader.has('player')).toBe(false);
    });

    it('should preload assets and track progress', async () => {
        const mockContainer = {
            instantiateModelsToScene: vi.fn(() => ({
                rootNodes: [{ name: 'test' }],
            })),
            dispose: vi.fn(),
        };
        SceneLoader.LoadAssetContainerAsync.mockResolvedValue(mockContainer);

        const loader = AssetLoader.getInstance();
        const progressCalls = [];
        await loader.preloadAll({}, (loaded, total, name) => {
            progressCalls.push({ loaded, total, name });
        });

        expect(loader.isLoaded()).toBe(true);
        expect(progressCalls.length).toBeGreaterThan(0);
        // Last call should have loaded === total
        const last = progressCalls[progressCalls.length - 1];
        expect(last.loaded).toBe(last.total);
    });

    it('should handle failed asset loads gracefully', async () => {
        SceneLoader.LoadAssetContainerAsync.mockRejectedValue(new Error('404 Not Found'));

        const loader = AssetLoader.getInstance();
        // Should not throw
        await loader.preloadAll({});

        expect(loader.isLoaded()).toBe(true);
        expect(loader.has('player')).toBe(false);
        expect(loader.hasFailed('player')).toBe(true);
        expect(loader.getFailedKeys().length).toBeGreaterThan(0);
    });

    it('should clone mesh from cached container', async () => {
        const mockRootNode = { name: 'cloned' };
        const mockContainer = {
            instantiateModelsToScene: vi.fn(() => ({
                rootNodes: [mockRootNode],
            })),
            dispose: vi.fn(),
        };
        SceneLoader.LoadAssetContainerAsync.mockResolvedValue(mockContainer);

        const loader = AssetLoader.getInstance();
        await loader.preloadAll({});

        const mesh = loader.cloneMesh('player', 'myPlayer');
        expect(mesh).toBe(mockRootNode);
        expect(mockContainer.instantiateModelsToScene).toHaveBeenCalled();
    });

    it('should return null for unloaded assets', async () => {
        SceneLoader.LoadAssetContainerAsync.mockRejectedValue(new Error('fail'));

        const loader = AssetLoader.getInstance();
        await loader.preloadAll({});

        const mesh = loader.cloneMesh('player', 'test');
        expect(mesh).toBeNull();
    });

    it('should dispose all cached containers', async () => {
        const mockContainer = {
            instantiateModelsToScene: vi.fn(() => ({ rootNodes: [{}] })),
            dispose: vi.fn(),
        };
        SceneLoader.LoadAssetContainerAsync.mockResolvedValue(mockContainer);

        const loader = AssetLoader.getInstance();
        await loader.preloadAll({});

        loader.dispose();
        expect(mockContainer.dispose).toHaveBeenCalled();
        expect(loader.isLoaded()).toBe(false);
        expect(loader.getLoadedKeys()).toHaveLength(0);
    });
});
