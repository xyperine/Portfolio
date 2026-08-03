export class Input {
    #keys;
    #mouseDelta;

    #onKeyUp;
    #onKeyDown;
    #onMouseMoved;

    constructor() {
        this.#keys = {};

        this.#onKeyDown = event => {
            event.preventDefault();

            this.#keys[event.code] = true;
        }
        window.addEventListener("keydown", this.#onKeyDown);

        this.#onKeyUp = event => {
            event.preventDefault();

            this.#keys[event.code] = false;
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