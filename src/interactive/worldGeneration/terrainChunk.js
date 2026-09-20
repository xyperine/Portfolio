import * as THREE from "three";
import * as RAPIER from "rapier";

export class TerrainChunk {
	/**
	 *
	 * @param {THREE.Points} renderObject
	 * @param {RAPIER.RigidBody} physicsObject
	 * @param {THREE.BufferGeometry} physicsGeometry
	 */
	constructor(renderObject, physicsObject, physicsGeometry) {
		this.renderObject = renderObject;
		this.physicsObject = physicsObject;
		this.physicsGeometry = physicsGeometry;

		this.objects = [];
	}

	getXZPosition() {
		let p = new THREE.Vector3();
		this.renderObject.getWorldPosition(p);
		p.y = 0;
		return p;
	}

	relocateTo(x, z) {
		this.physicsObject.setTranslation({
			x,
			y: this.physicsObject.translation().y,
			z,
		});
		const p = this.physicsObject.translation();
		this.renderObject.position.set(p.x, p.y, p.z);
		this.renderObject.updateMatrixWorld(true);
	}

	/**
	 *
	 * @param {any} object Must implement dispose() function
	 */
	addObject(object) {
		this.objects.push(object);
	}

	clearObjects() {
		for (let object of this.objects) {
			object.dispose();
		}
		this.objects = [];
	}

	render(gameState) {
		this.objects.forEach((o) => {
			o.update(gameState);
		});
	}
}
