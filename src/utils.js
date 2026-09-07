import * as THREE from "three";
import * as SEEDRANDOM from "seedrandom";
import * as yaml from "yaml";

export async function loadAsText(url) {
	const response = await fetch(url);
	return await response.text();
}

export async function loadYaml(url) {
	const yamlText = await loadAsText(url);
	return yaml.parse(yamlText);
}

export function getCssColorAsThreeColor(name) {
	return new THREE.Color(
		getComputedStyle(document.documentElement)
			.getPropertyValue(name)
			.trim(),
	);
}

export function nextGaussian() {
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

export function randGaussian(mean = 0, stdDev = 1) {
	return mean + nextGaussian() * stdDev;
}

export function randGaussianConstrained(min, max, mean = 0, stdDev = 1) {
	let x = 0;
	do {
		x = randGaussian(mean, stdDev);
	} while (x < min || x > max);

	return x;
}

export function celsiusToFahrenheit(c) {
	return c * 1.8 + 32;
}

export function celsiusToKelvin(c) {
	return c + 273.15;
}

export function kelvinToCelsius(k) {
	return k - 273.15;
}

export function toRoman(n) {
	var roman = {
		M: 1000,
		CM: 900,
		D: 500,
		CD: 400,
		C: 100,
		XC: 90,
		L: 50,
		XL: 40,
		X: 10,
		IX: 9,
		V: 5,
		IV: 4,
		I: 1,
	};
	var str = "";

	for (var i of Object.keys(roman)) {
		var q = Math.floor(n / roman[i]);
		n -= q * roman[i];
		str += i.repeat(q);
	}

	return str;
}

export function randomElement(array) {
	return array[Math.floor(Math.random() * array.length)];
}

export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function metresToFeet(m) {
	return m * 3.28084;
}

export function createSeededRandom(seed) {
	return new Math.seedrandom(seed);
}

export function seededRandomElement(random, array) {
	return array[Math.floor(random() * array.length)];
}

export function nextSeededGaussian(random) {
	let u = 0;
	let v = 0;
	let s = 0;

	do {
		u = 2 * random() - 1;
		v = 2 * random() - 1;
		s = u * u + v * v;
	} while (s >= 1 || s === 0);

	s = Math.sqrt((-2 * Math.log(s)) / s);
	return u * s;
}

export function seededGaussian(random, mean, stdDev) {
	return mean + nextSeededGaussian(random) * stdDev;
}

export function seededGaussianConstrained(random, min, max, mean, stdDev) {
	let x = 0;
	do {
		x = seededGaussian(random, mean, stdDev);
	} while (x < min || x > max);

	return x;
}

export function seededFloat(random, min, max) {
	const spread = max - min;
	return random() * spread + min;
}

export function seededInt(random, min, max) {
	const spread = max - min + 1;
	return Math.floor(random() * spread) + min;
}
