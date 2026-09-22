import * as THREE from "three";
import * as utils from "#src/utils.js";
import { Projects } from "#src/projects.js";

export class Compass {
	async init() {
		this.compassElement = document.querySelector("#compass");
		this.stripElement = document.querySelector("#compass-strip");

		this.compassDirections = {
			0: "N",
			90: "E",
			180: "S",
			270: "W",
		};

		this.lookDirection = new THREE.Vector3();
		this.horizontalFov = 90;
		this.pixelsPerDegree =
			this.compassElement.clientWidth / this.horizontalFov;

		this.markers = [];

		const interval = 15;
		for (let degree = -360; degree < 720; degree += interval) {
			const marker = document.createElement("div");
			marker.classList.add("compass-marker");
			marker.style.left = `${degree * this.pixelsPerDegree}px`;
			const normalizedDegree = ((degree % 360) + 360) % 360;
			const label = this.compassDirections[normalizedDegree];

			if (label) {
				const labelElement = document.createElement("div");

				labelElement.classList.add("compass-label");
				labelElement.textContent = label;

				marker.appendChild(labelElement);
			} else {
				const tick = document.createElement("div");

				tick.classList.add("compass-tick");

				marker.appendChild(tick);

				const labelElement = document.createElement("div");

				labelElement.classList.add("compass-tick-label");
				labelElement.textContent = `${normalizedDegree}`;

				marker.appendChild(labelElement);
			}

			this.markers.push({ element: marker, degree });

			this.stripElement.appendChild(marker);
		}

		this.points = [];

		this.pointerSvg = await utils.loadAsText("img/Compass Pointer.svg");
	}

	trackBeacon(beacon) {
		const project = Projects.get(beacon.projectId);
		const pointer = this.createPointer(
			project.interactive.number,
			project.color,
			beacon.position,
		);
		this.points.push(pointer);
	}

	createPointer(number, color, position) {
		const element = document.createElement("div");
		element.classList.add("compass-pointer");
		element.style.setProperty("--color", color);
		this.stripElement.appendChild(element);

		const outer = document.createElement("div");
		outer.classList.add("compass-pointer-outer");
		element.appendChild(outer);

		const container = document.createElement("div");
		container.innerHTML = this.pointerSvg;

		const inner = container.firstElementChild;
		inner.classList.add("compass-pointer-inner");
		outer.appendChild(inner);

		console.log(inner);

		const label = document.createElement("div");
		label.classList.add("compass-pointer-label");
		label.textContent = number.toString();
		outer.appendChild(label);

		const distanceLabel = document.createElement("div");
		distanceLabel.classList.add("compass-pointer-distance");
		element.appendChild(distanceLabel);

		return { element, position };
	}

	update(gameState) {
		const cameraHeading = this.getHeading(
			gameState.camera.getWorldDirection(this.lookDirection),
		);
		const cameraHeadingDegrees = THREE.MathUtils.radToDeg(cameraHeading);
		this.stripElement.style.transform = `translateX(${-cameraHeadingDegrees * this.pixelsPerDegree}px)`;

		const camPos = gameState.camera.getWorldPosition(new THREE.Vector3());
		for (let point of this.points) {
			const directionToPoint = point.position
				.clone()
				.sub(camPos)
				.normalize();
			const headingToPoint = this.getHeading(directionToPoint);
			let relativeHeadingToPoint = headingToPoint - cameraHeading;
			relativeHeadingToPoint =
				THREE.MathUtils.euclideanModulo(
					relativeHeadingToPoint + Math.PI,
					Math.PI * 2,
				) - Math.PI;
			let relativeHeadingToPointDegrees = THREE.MathUtils.radToDeg(
				relativeHeadingToPoint,
			);
			const offset = -point.element.clientWidth * 0.5;
			point.element.style.transform = `translateX(${(cameraHeadingDegrees + relativeHeadingToPointDegrees) * this.pixelsPerDegree + offset}px)`;

			const distance = point.position
				.clone()
				.sub(camPos)
				.setY(0)
				.length();
			point.element.querySelector(
				".compass-pointer-distance",
			).textContent = this.formatDistance(distance);
		}
	}

	formatDistance(meters) {
		if (meters >= 1000) {
			return `${(meters / 1000).toFixed(2)}km`;
		}
		if (meters < 1000) {
			return `${meters.toFixed(1)}m`;
		}
	}

	getHeading(direction) {
		direction.y = 0;
		direction.normalize();

		let heading = Math.atan2(direction.x, -direction.z);

		if (heading < 0) {
			heading += Math.PI * 2;
		}

		return heading;
	}

	resize() {
		this.pixelsPerDegree =
			this.compassElement.clientWidth / this.horizontalFov;
		this.markers.forEach((marker) => {
			marker.element.style.left = `${marker.degree * this.pixelsPerDegree}px`;
		});
	}

	dispose() {
		this.stripElement.replaceChildren();
	}
}
