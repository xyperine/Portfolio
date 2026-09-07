import * as utils from "#src/utils.js";

export class Temperature {
	constructor(degreesCelsius) {
		this.celsius = degreesCelsius;
		this.fahrenheit = utils.celsiusToFahrenheit(degreesCelsius);
		this.kelvin = utils.celsiusToKelvin(degreesCelsius);
	}

	static fromKelvin(k) {
		const celsius = utils.kelvinToCelsius(k);
		return new Temperature(celsius);
	}
}
