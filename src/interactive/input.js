export class Input {
    #keys;
    #mouseDelta;
    #horizontalMouseSensitivity;
    #verticalMouseSensitivity;
    
    #onKeyUp;
    #onKeyDown;
    #onMouseMoved;

    constructor() {
        this.#keys = {};
        this.keysToIgnore = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "Tab"];

        this.#onKeyDown = event => {
            if (this.keysToIgnore.includes(event.code)) {
                event.preventDefault();
            }

            this.#keys[event.code] = true;
        }
        window.addEventListener("keydown", this.#onKeyDown);

        this.#onKeyUp = event => {
            if (this.keysToIgnore.includes(event.code)) {
                event.preventDefault();
            }

            this.#keys[event.code] = false;
        }
        window.addEventListener("keyup", this.#onKeyUp);

        this.#horizontalMouseSensitivity = 1;
        this.#verticalMouseSensitivity = 1;
        this.#mouseDelta = {x: 0, y: 0};
        this.#onMouseMoved = event => {
            if (document.pointerLockElement != null) {
                this.#mouseDelta.x += event.movementX * this.#horizontalMouseSensitivity;
                this.#mouseDelta.y += event.movementY * this.#verticalMouseSensitivity;
            }
        }
        document.addEventListener("mousemove", this.#onMouseMoved);
    }

    update() {
        this.#mouseDelta.x = 0;
        this.#mouseDelta.y = 0;
    }

    async requestPointerLock(element) {
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
        return this.#keys[key] === true;
    }

    dispose() {
        window.removeEventListener("keydown", this.#onKeyDown);
        window.removeEventListener("keyup", this.#onKeyUp);
        document.removeEventListener("mousemove", this.#onMouseMoved);
    }
}