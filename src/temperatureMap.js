import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MathUtils } from 'three/src/Three.Core.js';

export class TemperatureMap {
    constructor() {
        this.simplex = new SimplexNoise();

        this.scale = MathUtils.randFloat(8e-5, 1.2e-4);
        this.base = this.randGaussianConstrained(-273.15, 300, 0, 250);
        this.variation = MathUtils.randFloat(1, 10);
    }

    temperatureAt(x, y, z) {
        const celsius = this.base + this.simplex.noise3d(
            x * this.scale, y * this.scale, z * this.scale
        ) * this.variation;
        const fahrenheit = this.celsiusToFahrenheit(celsius);
        const kelvin = this.celsiusToKelvin(celsius);
        const t = {
            celsius, 
            fahrenheit,
            kelvin
        };
        return t;
    }

    nextGaussian() {
        let u = 0;
        let v = 0;
        let s = 0;

        do {
            u = 2 * Math.random() - 1;
            v = 2 * Math.random() - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);

        s = Math.sqrt((-2 * Math.log(s)) / s);
        return u * s;
    }

    randGaussian(mean = 0, stdDev = 1) {
        return mean + this.nextGaussian() * stdDev;
    }

    randGaussianConstrained(min, max, mean = 0, stdDev = 1) {
        let x = 0;
        do {
            x = this.randGaussian(mean, stdDev);
        } while (x < min || x > max);

        return x;
    }

    celsiusToFahrenheit(c) {
        return (c * 1.8) + 32;
    }

    celsiusToKelvin(c) {
        return c + 273.15;
    }
}