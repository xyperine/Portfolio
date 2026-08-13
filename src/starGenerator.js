import * as utils from '#src/utils.js';
import { Star } from '#src/star.js';

export class StarGenerator {
    constructor() {
        
    }

    generate() {
        const planetsInSystem = Math.round(utils.randGaussianConstrained(1, 12, 4, 3));
        const SUN_LUMINOSITY = 3.828e26;
        const SUN_RADIUS = 6.957e8;
        //const mass = this.generateMass();
        const radius = SUN_RADIUS * Math.pow(10, utils.randGaussian(-2, 2, 0, 0.8));//Math.pow(mass, 0.8);
        const luminosity = SUN_LUMINOSITY * Math.pow(10, utils.randGaussian(-1, 1));//Math.pow(mass, 3.5);

        return new Star(planetsInSystem, luminosity, radius);
    }

    // shit
    generateMass() {
        const min = 0.01;
        const max = 20;

        const u = Math.random();

        const mass = min * Math.pow(max / min, u);
        return mass;
    }
}