import * as utils from '#src/utils.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MathUtils } from 'three/src/Three.Core.js';
import { Temperature } from '#src/temperature.js';

export class TemperatureMap {
    constructor() {
        this.simplex = new SimplexNoise();

        this.scale = MathUtils.randFloat(1e-4, 3e-4);
        this.base = utils.randGaussianConstrained(-270, 1000, 0, 100);
        this.variationStrength = MathUtils.randFloat(10, 20);
    }

    temperatureAt(x, y, z) {
        const localVariation = this.simplex.noise(x * this.scale, z * this.scale) * this.variationStrength;
        const altitudeEffect = -Math.abs(y) * 0.01;
        const celsius = Math.max(this.base + localVariation + altitudeEffect, -272);
        const t = new Temperature(celsius);
        return t;
    }
}