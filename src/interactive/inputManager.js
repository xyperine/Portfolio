import * as THREE from "three";
import { Input } from "#src/interactive/input.js";

/**
 * Provides higher-level input functionality, like tracking specific keys, setting key maps, etc.
 */
export class InputManager {
    #EModes = {
        GLIDER: 0,
        UI: 1,
    };

    #input;

    #horizontalMouseSensitivity;
    #verticalMouseSensitivity;
    #uiModeKeys;
    #gliderModeKeys;

    /**
     * 
     * @param {Input} input 
     */
    constructor(input) {
        this.#input = input;
        
        this.#horizontalMouseSensitivity = 1;
        this.#verticalMouseSensitivity = 1;
        this.#uiModeKeys = ["KeyE"];
        this.#gliderModeKeys = [
            "KeyW", "KeyA", "KeyS", "KeyD", 
            "KeyE",
            "Digit1", "Digit2", "Digit3", "Digit4", "Digit5"
        ];

        this.mode = null;
        this.toGliderMode();
    }

    toUIMode() {
        this.mode = this.#EModes.UI;

        this.#input.unlockPointer();
        this.#input.changeKeysToTrack(this.#uiModeKeys);
    }

    toGliderMode() {
        this.mode = this.#EModes.GLIDER;

        this.#input.requestPointerLock();
        this.#input.changeKeysToTrack(this.#gliderModeKeys);
    }

    isInteractionKeyPressed() {
        const correctMode = this.mode === this.#EModes.GLIDER;
        const keyPressed = this.#input.isKeyPressed("KeyE");

        return correctMode && keyPressed;
    }

    isCloseUIKeyPressed() {
        const correctMode = this.mode === this.#EModes.UI;
        const keyPressed = this.#input.isKeyPressed("KeyE");

        return correctMode && keyPressed;
    }

    getMovementInput() {
        const correctMode = this.mode === this.#EModes.GLIDER;
        const input = new THREE.Vector3();
        if (correctMode) {
            if (this.#input.isKeyDown("KeyW")) {
                input.z += 1;
            }
            if (this.#input.isKeyDown("KeyS")) {
                input.z += -1;
            }
            if (this.#input.isKeyDown("KeyD")) {
                input.x += 1;
            }
            if (this.#input.isKeyDown("KeyA")) {
                input.x += -1;
            }
        }

        return input.normalize();
    }

    getMouseDelta() {
        const mouseDelta = this.#input.getMouseDelta();
        return {
            x: mouseDelta.x * this.#horizontalMouseSensitivity, 
            y: mouseDelta.y * this.#verticalMouseSensitivity
        };
    }
}