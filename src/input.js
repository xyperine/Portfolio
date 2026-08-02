export class Input {
    constructor() {
        this.keys = {};

        this.onKeyDown = event => {
            event.preventDefault();

            this.keys[event.code] = true;
        }
        window.addEventListener("keydown", this.onKeyDown);

        this.onKeyUp = event => {
            event.preventDefault();

            this.keys[event.code] = false;
        }
        window.addEventListener("keyup", this.onKeyUp);
    }
    
    isKeyDown(key) {
        return this.keys[key] === true;
    }

    dispose() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }
}