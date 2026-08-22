import * as utils from "#src/utils.js";
import { Glider } from "#src/interactive/glider.js";

export class Hud {
    /**
     * 
     * @param {Glider} glider 
     */
    constructor(glider, planetName, gravity) {
        this.glider = glider;
        this.planetName = planetName;
        this.gravity = gravity;

        this.planetNameElement = document.querySelector("#planet-name span:last-child");
        this.coordElement = document.querySelector("#coord span:last-child");
        this.altitudeElement = document.querySelector("#altitude span:last-child");
        this.temperatureElement = document.querySelector("#temperature span:last-child");
        this.gravityElement = document.querySelector("#gravity span:last-child");
    }

    update() {
        this.planetNameElement.textContent = `${this.planetName.name} / ${this.planetName.designation}`;

        const position = this.glider.body.translation();
        this.coordElement.textContent = `X: ${position.x.toFixed(1)} Z: ${position.z.toFixed(1)}`;

        const altitude = this.glider.altitude;
        const altitudeFt = utils.metresToFeet(altitude);
        this.altitudeElement.textContent = `${altitude.toFixed(1)}m / ${altitudeFt.toFixed(1)}ft`;

        const temperature = this.glider.getTemperatureReading();
        this.temperatureElement.textContent = 
            `${temperature.celsius.toFixed(1)}°C / \
            ${temperature.fahrenheit.toFixed(1)}°F / \
            ${temperature.kelvin.toFixed(1)}K`;
        
        const gravity = this.gravity;
        this.gravityElement.textContent = `${gravity.toFixed(1)}g`;
    }
}