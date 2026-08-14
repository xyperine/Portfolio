import * as utils from "#src/utils.js"
import { PlanetNameGenerator } from "#src/planetNameGenerator.js";
import { PlanetInfo } from "#src/planetInfo.js";
import { StarGenerator } from "#src/starGenerator.js";

export class PlanetGenerator {
    constructor(seed) {
        this.random = new Math.seedrandom(seed);
        this.nameGenerator = new PlanetNameGenerator(this.random().toString());
        this.starGenerator = new StarGenerator(this.random().toString());
    }

    generate() {
        const star = this.starGenerator.generate();
        const index = Math.floor(this.random() * star.planetsCount) + 1;
        const AU = 1.49597870691e11;
        const distance = AU * Math.pow(10, this.random() * 4.6 - 2.3) + star.radius;
        const name = this.nameGenerator.generate(index);
        const albedo = utils.seededGaussianConstrained(this.random, 0.01, 1, 0.3, 0.2);
        const pi = new PlanetInfo(name, distance, albedo, star);
        return pi;
    }
}