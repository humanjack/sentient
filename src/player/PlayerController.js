/**
 * PlayerController.js - Handles player mesh, movement, rotation, and collision.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { AssetLoader } from '../core/AssetLoader.js';

export class PlayerController {
    constructor(scene, inputManager) {
        this.scene = scene;
        this.input = inputManager;

        // Movement properties
        this.moveSpeed = 5;
        this.sprintSpeed = 8;
        this.isSprinting = false;

        // Rotation properties
        this.rotationSpeed = 0.003;

        // Player dimensions
        this.height = 2;
        this.radius = 0.5;

        // Create the player mesh
        this.createPlayerMesh();

        // Cache obstacle meshes for collision
        this.obstacles = [];
        this.cacheObstacles();

        console.log('PlayerController initialized');
    }

    /**
     * Cache all obstacle meshes for collision detection.
     */
    cacheObstacles() {
        // Get all cover objects and walls
        this.obstacles = this.scene.meshes.filter(mesh => {
            const name = mesh.name;
            return name.startsWith('cover_') ||
                   name === 'northWall' ||
                   name === 'southWall' ||
                   name === 'eastWall' ||
                   name === 'westWall';
        });
        console.log('Cached obstacles:', this.obstacles.map(m => m.name));
    }

    /**
     * Create the player mesh - a capsule with a bright material.
     */
    createPlayerMesh() {
        // Parent node for easy positioning
        this.playerNode = new TransformNode('player', this.scene);
        this.playerNode.position = new Vector3(0, 0, 0);

        // Try to use loaded 3D model
        const loader = AssetLoader.getInstance();
        if (loader && loader.hasAsset('player')) {
            const model = loader.createInstance('player', 'playerModel');
            if (model) {
                model.parent = this.playerNode;
                model.position.y = 0;
                this.mesh = model;
                return;
            }
        }

        // Fallback: procedural capsule
        const body = MeshBuilder.CreateCylinder(
            'playerBody',
            { height: this.height - this.radius * 2, diameter: this.radius * 2, tessellation: 16 },
            this.scene
        );
        body.parent = this.playerNode;
        body.position.y = this.height / 2;

        const topCap = MeshBuilder.CreateSphere(
            'playerTopCap',
            { diameter: this.radius * 2, slice: 0.5 },
            this.scene
        );
        topCap.parent = this.playerNode;
        topCap.position.y = this.height - this.radius;

        const bottomCap = MeshBuilder.CreateSphere(
            'playerBottomCap',
            { diameter: this.radius * 2, slice: 0.5 },
            this.scene
        );
        bottomCap.parent = this.playerNode;
        bottomCap.position.y = this.radius;
        bottomCap.rotation.x = Math.PI;

        const playerMaterial = new StandardMaterial('playerMaterial', this.scene);
        playerMaterial.diffuseColor = new Color3(0.2, 0.6, 1.0);
        playerMaterial.emissiveColor = new Color3(0.05, 0.15, 0.25);
        body.material = playerMaterial;
        topCap.material = playerMaterial;
        bottomCap.material = playerMaterial;

        const indicator = MeshBuilder.CreateBox(
            'directionIndicator',
            { width: 0.2, height: 0.2, depth: 0.5 },
            this.scene
        );
        indicator.parent = this.playerNode;
        indicator.position = new Vector3(0, this.height / 2, this.radius + 0.1);
        const indicatorMat = new StandardMaterial('indicatorMat', this.scene);
        indicatorMat.diffuseColor = new Color3(1.0, 0.8, 0.2);
        indicatorMat.emissiveColor = new Color3(0.2, 0.15, 0.0);
        indicator.material = indicatorMat;

        this.mesh = body;
    }

    /**
     * Update player - called every frame.
     */
    update(deltaTime) {
        this.handleRotation();
        this.handleMovement(deltaTime);
    }

    /**
     * Handle mouse rotation (requires pointer lock).
     */
    handleRotation() {
        if (!this.input.isLocked()) return;

        const delta = this.input.getMouseDelta();
        if (delta.x !== 0) {
            this.playerNode.rotation.y += delta.x * this.rotationSpeed;
        }
    }

    /**
     * Handle WASD movement with collision.
     */
    handleMovement(deltaTime) {
        let moveX = 0;
        let moveZ = 0;

        const w = this.input.isKeyDown('w');
        const s = this.input.isKeyDown('s');
        const a = this.input.isKeyDown('a');
        const d = this.input.isKeyDown('d');

        if (w) moveZ = 1;
        if (s) moveZ = -1;
        if (a) moveX = -1;
        if (d) moveX = 1;

        // Debug: log any detected input
        if (w || s || a || d) {
            console.log('Input detected:', { w, s, a, d, moveX, moveZ });
        }

        if (moveX === 0 && moveZ === 0) return;

        // Sprint check
        this.isSprinting = this.input.isKeyDown('shift');
        const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;

        // Normalize diagonal movement
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (length > 0) {
            moveX /= length;
            moveZ /= length;
        }

        // Calculate movement in world space (W=+Z, S=-Z, A=-X, D=+X)
        const movement = new Vector3(
            moveX * speed * deltaTime,
            0,
            moveZ * speed * deltaTime
        );

        // Try to move with collision
        this.moveWithCollision(movement);
    }

    /**
     * Move player with collision detection against obstacles.
     */
    moveWithCollision(movement) {
        const currentPos = this.playerNode.position.clone();
        const newPos = currentPos.add(movement);

        // Arena bounds
        const bound = 24;
        newPos.x = Math.max(-bound, Math.min(bound, newPos.x));
        newPos.z = Math.max(-bound, Math.min(bound, newPos.z));

        // Check collision with all obstacles
        let blocked = false;
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(newPos, obstacle)) {
                blocked = true;
                break;
            }
        }

        if (!blocked) {
            // No collision, move freely
            this.playerNode.position = newPos;
        } else {
            // Try sliding along X axis only
            const slideX = currentPos.clone();
            slideX.x = Math.max(-bound, Math.min(bound, currentPos.x + movement.x));

            let blockedX = false;
            for (const obstacle of this.obstacles) {
                if (this.checkCollision(slideX, obstacle)) {
                    blockedX = true;
                    break;
                }
            }

            // Try sliding along Z axis only
            const slideZ = currentPos.clone();
            slideZ.z = Math.max(-bound, Math.min(bound, currentPos.z + movement.z));

            let blockedZ = false;
            for (const obstacle of this.obstacles) {
                if (this.checkCollision(slideZ, obstacle)) {
                    blockedZ = true;
                    break;
                }
            }

            // Apply whichever slide works
            if (!blockedX) {
                this.playerNode.position = slideX;
            } else if (!blockedZ) {
                this.playerNode.position = slideZ;
            }
            // If both blocked, don't move
        }
    }

    /**
     * Check AABB collision between player position and obstacle.
     */
    checkCollision(playerPos, obstacle) {
        const bounds = obstacle.getBoundingInfo();
        if (!bounds) return false;

        const min = bounds.boundingBox.minimumWorld;
        const max = bounds.boundingBox.maximumWorld;

        // Expand obstacle bounds by player radius
        const expandedMinX = min.x - this.radius;
        const expandedMaxX = max.x + this.radius;
        const expandedMinZ = min.z - this.radius;
        const expandedMaxZ = max.z + this.radius;

        // Check if player center is inside expanded bounds
        return (
            playerPos.x >= expandedMinX &&
            playerPos.x <= expandedMaxX &&
            playerPos.z >= expandedMinZ &&
            playerPos.z <= expandedMaxZ
        );
    }

    getPosition() {
        return this.playerNode.position.clone();
    }

    getForwardDirection() {
        const y = this.playerNode.rotation.y;
        return new Vector3(Math.sin(y), 0, Math.cos(y));
    }

    getPlayerNode() {
        return this.playerNode;
    }
}
