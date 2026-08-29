/**
 * Provides raw user inputs and handles input-related behavior.
 */
export class Input {
    #keysDown;
    #keysPressed;
    #keysToTrack;
    #keysToIgnore;
    #mouseDelta;
    #pointerLockElement;
    
    #onKeyUp;
    #onKeyDown;
    #onMouseMoved;

    constructor() {
        this.#keysDown = new Set();
        this.#keysPressed = new Set();
        this.#keysToTrack = [];
        this.#keysToIgnore = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "Tab"];

        this.#onKeyDown = event => {
            if (this.#keysToIgnore.includes(event.code)) {
                event.preventDefault();
            }
            if (!this.#keysToTrack.includes(event.code)) {
                return;
            }
            
            if (!this.#keysDown.has(event.code)) {
                this.#keysPressed.add(event.code);
            }
            this.#keysDown.add(event.code);
        }
        window.addEventListener("keydown", this.#onKeyDown);

        this.#onKeyUp = event => {
            if (this.#keysToIgnore.includes(event.code)) {
                event.preventDefault();
            }

            this.#keysDown.delete(event.code);
        }
        window.addEventListener("keyup", this.#onKeyUp);

        this.#mouseDelta = {x: 0, y: 0};
        this.#onMouseMoved = event => {
            if (document.pointerLockElement != null) {
                this.#mouseDelta.x += event.movementX;
                this.#mouseDelta.y += event.movementY;
            }
        }
        document.addEventListener("mousemove", this.#onMouseMoved);

        this.#pointerLockElement = null;
    }

    setPointerLockElement(element) {
        this.#pointerLockElement = element;
    }

    update() {
        this.#mouseDelta.x = 0;
        this.#mouseDelta.y = 0;

        this.#keysPressed.clear();
    }

    async requestPointerLock(element = this.#pointerLockElement) {
        try {
            await element.requestPointerLock({
                unadjustedMovement: true
            });
        } catch (error) {
            console.error(error);
            await element.requestPointerLock();
        }
    }

    unlockPointer() {
        document.exitPointerLock();
    }

    getMouseDelta() {
        return this.#mouseDelta;
    }
    
    isKeyDown(key) {
        return this.#keysDown.has(key);
    }

    isKeyPressed(key) {
        return this.#keysPressed.has(key);
    }

    changeKeysToTrack(keys) {
        this.#keysToTrack = keys;
        this.#keysDown.clear();
        this.#keysPressed.clear();
    }

    dispose() {
        window.removeEventListener("keydown", this.#onKeyDown);
        window.removeEventListener("keyup", this.#onKeyUp);
        document.removeEventListener("mousemove", this.#onMouseMoved);
    }
}