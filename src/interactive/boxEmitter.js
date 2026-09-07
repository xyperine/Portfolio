/**
 * Box emitter shape for the Quarks.
 */
export class BoxEmitter {
	type = "box";

	constructor(size) {
		this.size = size;
	}

	update(system, delta) {}

	initialize(p, emissionState) {
		p.position.set(
			(Math.random() - 0.5) * this.size.x,
			(Math.random() - 0.5) * this.size.y,
			(Math.random() - 0.5) * this.size.z,
		);

		p.velocity.copy(p.position).normalize().multiplyScalar(p.startSpeed);
	}

	clone() {
		return new BoxEmitter(this.size.clone());
	}
}
