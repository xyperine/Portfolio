import * as utils from "#src/utils.js";
import * as SEEDRANDOM from "seedrandom";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import { Temperature } from "#src/interactive/worldGeneration/temperature.js";

export class TemperatureMap {
	constructor(planetInfo, seed) {
		this.random = new Math.seedrandom(seed);
		this.simplex = new SimplexNoise(new R(seed));

		const equilibriumKelvin = this.calculateEquilibrium(planetInfo);
		this.equilibrium = utils.kelvinToCelsius(equilibriumKelvin);

		this.greenHouseEffect = utils.seededGaussianConstrained(
			this.random,
			0,
			200,
			30,
			25,
		);

		this.scale = utils.seededFloat(this.random, 1e-4, 3e-4);
		this.variationStrength = utils.seededFloat(this.random, 10, 20);

		console.log(planetInfo);
	}

	calculateEquilibrium(planetInfo) {
		const luminosity = planetInfo.star.luminosity;
		const distance = planetInfo.distance;
		const boltzmann = 5.670374419e-8;
		const equilibriumKelvin = Math.pow(
			(luminosity * (1 - planetInfo.albedo)) /
				(16 * boltzmann * Math.PI * distance ** 2),
			0.25,
		);

		return equilibriumKelvin;
	}

	temperatureAt(x, y, z) {
		const localVariation =
			this.simplex.noise(x * this.scale, z * this.scale) *
			this.variationStrength;
		const altitudeEffect = -Math.abs(y) * 0.01;
		const celsius = Math.max(
			this.equilibrium +
				this.greenHouseEffect +
				localVariation +
				altitudeEffect,
			-272,
		);
		const t = new Temperature(celsius);
		return t;
	}
}

class R {
	constructor(seed) {
		this.random = new Math.seedrandom(seed);
	}
}
