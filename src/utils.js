import * as THREE from 'three';

export async function loadAsText(url) {
    const response = await fetch(url);
    return await response.text();
}

export function getCssColorAsThreeColor(name) {
    return new THREE.Color(
        getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim()
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
    return mean + this.nextGaussian() * stdDev;
}

export function randGaussianConstrained(min, max, mean = 0, stdDev = 1) {
    let x = 0;
    do {
        x = this.randGaussian(mean, stdDev);
    } while (x < min || x > max);

    return x;
}

export function celsiusToFahrenheit(c) {
    return (c * 1.8) + 32;
}

export function celsiusToKelvin(c) {
    return c + 273.15;
}