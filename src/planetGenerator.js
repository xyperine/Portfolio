import * as utils from "#src/utils.js"
import { PlanetNameGenerator } from "#src/planetNameGenerator.js";
import { PlanetInfo } from "#src/planetInfo.js";

export class PlanetGenerator {
    constructor() {
        this.nameGenerator = new PlanetNameGenerator();
    }

    generate() {
        const planetsInSystem = Math.round(utils.randGaussianConstrained(1, 12, 4, 3));
        const index = Math.floor(Math.random() * planetsInSystem) + 1;
        const distance = index / planetsInSystem;
        const name = this.nameGenerator.generate(index);
        const pi = new PlanetInfo(name, distance);
        return pi;
    }
}