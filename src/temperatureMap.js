import * as utils from '#src/utils.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MathUtils } from 'three/src/Three.Core.js';
import { Temperature } from '#src/temperature.js';

export class TemperatureMap {
    constructor(planetInfo) {
        this.simplex = new SimplexNoise();
        
        const equilibriumKelvin = this.calculateEquilibrium(planetInfo);
        this.equilibrium = utils.kelvinToCelsius(equilibriumKelvin);
        
        this.greenHouseEffect = utils.randGaussianConstrained(0, 200, 30, 25);
        
        this.scale = MathUtils.randFloat(1e-4, 3e-4);
        this.variationStrength = MathUtils.randFloat(10, 20);

        console.log(planetInfo);
    }

    calculateEquilibrium(planetInfo) {
        const luminosity = planetInfo.star.luminosity;
        const distance = planetInfo.distance;
        const boltzmann = 5.670374419e-8;
        const equilibriumKelvin = Math.pow(
            luminosity * (1 - planetInfo.albedo) / (16 * boltzmann * Math.PI * distance ** 2), 
            0.25
        );

        return equilibriumKelvin;
    }

    temperatureAt(x, y, z) {
        const localVariation = this.simplex.noise(x * this.scale, z * this.scale) * this.variationStrength;
        const altitudeEffect = -Math.abs(y) * 0.01;
        const celsius = Math.max(this.equilibrium + this.greenHouseEffect + localVariation + altitudeEffect, -272);
        const t = new Temperature(celsius);
        return t;
    }
}