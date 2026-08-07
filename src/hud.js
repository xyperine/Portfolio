import { Glider } from "#src/glider.js";

export class Hud {
    /**
     * 
     * @param {Glider} glider 
     */
    constructor(glider) {
        this.glider = glider;

        this.coordElement = document.querySelector("#coord span:last-child");
        this.altitudeElement = document.querySelector("#altitude span:last-child")
    }

    update() {
        const position = this.glider.body.translation();
        this.coordElement.textContent = `X: ${position.x.toFixed(1)} Z: ${position.z.toFixed(1)}`;

        const altitude = this.glider.altitude;
        this.altitudeElement.textContent = `${altitude.toFixed(1)}m`;
    }
}