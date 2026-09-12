import * as THREE from "three";
import { Interactables } from "#src/interactive/interactions/interactables.js";

export class Interactor {
	constructor(distance, camera) {
		this.distance = distance;
		this.camera = camera;

		this.currentInteractable = null;

		this.interactElement = document.querySelector("#game-ui #interact-label");
	}

	update() {
		this.currentInteractable = this.findInteractable();

		this.interactElement.classList.toggle("visible", this.currentInteractable != null);
	}

	findInteractable() {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
		raycaster.far = this.distance;
		const hits = raycaster.intersectObjects(Interactables.items, true);

		for (let hit of hits) {
			if (hit.object != null) {
				if (hit.object.userData.interactable != undefined) {
					return hit.object.userData.interactable;
				}
			}
		}

		return null;
	}

	interact() {
		this.currentInteractable?.interact();
	}
}
