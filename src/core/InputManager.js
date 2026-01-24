/**
 * InputManager.js - Simple keyboard and mouse input handler.
 */
export class InputManager {
    static instance = null;

    static getInstance(canvas = null) {
        if (!InputManager.instance && canvas) {
            InputManager.instance = new InputManager(canvas);
        }
        return InputManager.instance;
    }

    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.pointerLocked = false;

        // Keyboard
        document.onkeydown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
            console.log('DOWN:', e.key);
        };

        document.onkeyup = (e) => {
            this.keys[e.key.toLowerCase()] = false;
            console.log('UP:', e.key);
        };

        // Mouse movement
        document.onmousemove = (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseDeltaX = e.movementX || 0;
            this.mouseDeltaY = e.movementY || 0;
        };

        // Pointer lock on click
        canvas.onclick = () => {
            if (!this.pointerLocked) {
                canvas.requestPointerLock();
            }
        };

        document.onpointerlockchange = () => {
            this.pointerLocked = document.pointerLockElement === canvas;
            console.log('Pointer lock:', this.pointerLocked);
        };

        // Prevent right-click menu
        canvas.oncontextmenu = (e) => e.preventDefault();

        console.log('InputManager ready');
    }

    isKeyDown(key) {
        return this.keys[key.toLowerCase()] === true;
    }

    getMouseDelta() {
        return { x: this.mouseDeltaX, y: this.mouseDeltaY };
    }

    resetMouseDelta() {
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
    }

    isLocked() {
        return this.pointerLocked;
    }
}
