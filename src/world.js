import * as THREE from 'three';

export class World {
    constructor() {
        this.VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
        this.VECTOR3_UP = new THREE.Vector3(0, 1, 0);
        this.VECTOR3_FORWARD = new THREE.Vector3(0, 0, -1);

        this.init();
    }

    init() {}
    render(elapsedTime) {}
    updateColors() {}
    dispose() {}

    resize(width, height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    getCssColor(name) {
        return new THREE.Color(
            getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim()
        );
    }
}