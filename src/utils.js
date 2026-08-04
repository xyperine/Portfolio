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