import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MathUtils } from 'three/src/Three.Core.js';
import * as utils from '#src/utils.js';

export class TemperatureMap {
    constructor() {
        this.simplex = new SimplexNoise();

        this.scale = MathUtils.randFloat(8e-5, 1.2e-4);
        this.base = utils.randGaussianConstrained(-273.15, 300, 0, 250);
        this.variation = MathUtils.randFloat(1, 10);
    }

    temperatureAt(x, y, z) {
        const celsius = this.base + this.simplex.noise3d(
            x * this.scale, y * this.scale, z * this.scale
        ) * this.variation;
        const fahrenheit = utils.celsiusToFahrenheit(celsius);
        const kelvin = utils.celsiusToKelvin(celsius);
        const t = {
            celsius, 
            fahrenheit,
            kelvin
        };
        return t;
    }
}