import * as THREE from "three";

/**
 * Represents a high-level coordination of the simulation.
 */
export class World {
	constructor() {
		this.VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
		this.VECTOR3_UP = new THREE.Vector3(0, 1, 0);
		this.VECTOR3_FORWARD = new THREE.Vector3(0, 0, -1);
	}

	async init() {}
	update(elapsedTime) {}
	updateColors() {}
	dispose() {}

	resize(width, height) {
		this.renderer.setSize(width, height);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}
}
