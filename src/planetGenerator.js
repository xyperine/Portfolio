import * as utils from "#src/utils.js"
import { PlanetNameGenerator } from "#src/planetNameGenerator.js";
import { PlanetInfo } from "#src/planetInfo.js";
import { StarGenerator } from "#src/starGenerator.js";

export class PlanetGenerator {
    constructor() {
        this.nameGenerator = new PlanetNameGenerator();
        this.starGenerator = new StarGenerator();
    }

    generate() {
        const star = this.starGenerator.generate();
        const index = Math.floor(Math.random() * star.planetsCount) + 1;
        const AU = 1.49597870691e11;
        const distance = AU * Math.pow(10, Math.random() * 4.6 - 2.3) + star.radius;
        const name = this.nameGenerator.generate(index);
        const albedo = utils.randGaussianConstrained(0.01, 1, 0.3, 0.2);
        const pi = new PlanetInfo(name, distance, albedo, star);
        return pi;
    }
}