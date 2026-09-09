import * as THREE from "three";
import * as utils from "#src/utils.js";
import * as SEEDRANDOM from "seedrandom";
import { World } from "#src/world.js";
import { FPSCounter } from "#src/fpsCounter.js";
import { Shaders } from "#src/shaders.js";
import { Projects } from "#src/projects.js";

export class SimpleWorld extends World {
	constructor() {
		super();

		this.init();
	}

	async init() {
		this.terrainSize = new THREE.Vector2(600, 400);

		this.random = new Math.seedrandom();

		// Scene
		const backgroundColor =
			utils.getCssColorAsThreeColor("--background-color");
		this.scene = new THREE.Scene();
		this.scene.background = backgroundColor;
		const fog = new THREE.Fog(backgroundColor, 40, 180);
		this.scene.fog = fog;

		// Camera
		const cameraRotation = new THREE.Vector3(
			-15 * THREE.MathUtils.DEG2RAD,
			0 * THREE.MathUtils.DEG2RAD,
			0 * THREE.MathUtils.DEG2RAD,
		);
		this.camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			0.1,
			180,
		);
		const heightLimit = utils.seededFloat(this.random, 10, 25);
		this.camera.position.set(0, heightLimit + 15, 0);
		this.camera.rotateOnWorldAxis(this.VECTOR3_RIGHT, cameraRotation.x);
		this.camera.rotateOnWorldAxis(this.VECTOR3_UP, cameraRotation.y);
		this.camera.rotateOnWorldAxis(this.VECTOR3_FORWARD, cameraRotation.z);

		// Renderer
		this.renderer = new THREE.WebGLRenderer({
			canvas: document.querySelector("#terrain"),
			antialias: true,
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setAnimationLoop((elapsedTime) => {
			this.update(elapsedTime);
		});

		// Terrain
		const terrainGeometry = new THREE.PlaneGeometry(
			this.terrainSize.x,
			this.terrainSize.y,
			this.terrainSize.x,
			this.terrainSize.y,
		);

		// Points
		const freq = utils.seededFloat(this.random, 0.003, 0.01);
		const octaves = utils.seededInt(this.random, 6, 8);
		const lacunarity = utils.seededFloat(this.random, 1.9, 2.1);
		const persistence = utils.seededFloat(this.random, 0.4, 0.5);
		this.pointsMaterial = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.merge([
				THREE.UniformsLib.fog,
				{
					seed: { value: this.random() },
					heightLimit: { value: heightLimit },
					freq: { value: freq },
					octaves: { value: octaves },
					lacunarity: { value: lacunarity },
					persistence: { value: persistence },
					pointSize: { value: 0.2 },
					terrainColor: {
						value: utils.getCssColorAsThreeColor("--terrain-color"),
					},
				},
			]),

			vertexShader: Shaders.terrainVert,
			fragmentShader: Shaders.terrainFrag,
			fog: true,
		});
		this.points = new THREE.Points(terrainGeometry, this.pointsMaterial);
		this.points.rotation.set(
			-90 * THREE.MathUtils.DEG2RAD,
			0 * THREE.MathUtils.DEG2RAD,
			0 * THREE.MathUtils.DEG2RAD,
		);
		this.scene.add(this.points);

		// Projects
		for (const id of Projects.getAllIDs()) {
			const projectData = Projects.get(id);
			this.createProjectCardElement(projectData);
		}

		// Events
		const mainElement = document.querySelector("main");
		this.onWindowResized = () => {
			this.resize(mainElement.clientWidth, mainElement.clientHeight);
		};
		window.addEventListener("resize", this.onWindowResized);
		this.resize(mainElement.clientWidth, mainElement.clientHeight);

		// Diagnostics
		this.fpsCounter = new FPSCounter();
	}

	createProjectCardElement(projectData) {
		const cardsContainer = document.querySelector(".projects-container");

		const element = document.createElement("div");
		element.classList.add("project-card");
		element.style.setProperty("--color", projectData.interactive.color);
		cardsContainer.appendChild(element);

		const content = document.createElement("div");
		content.classList.add("content");
		element.appendChild(content);

		const coverElement = document.createElement("img");
		coverElement.setAttribute("src", projectData.coverImage);
		content.appendChild(coverElement);

		const titleElement = document.createElement("div");
		titleElement.classList.add("title");
		titleElement.textContent = projectData.name;
		content.appendChild(titleElement);

		const metaTagElement = document.createElement("div");
		metaTagElement.classList.add("meta-tag");
		metaTagElement.textContent = projectData.metaTag;
		content.appendChild(metaTagElement);

		const descriptionElement = document.createElement("div");
		descriptionElement.classList.add("description");
		descriptionElement.textContent = projectData.description;
		content.appendChild(descriptionElement);

		const learnElement = document.createElement("a");
		learnElement.classList.add("learn");
		learnElement.textContent = "learn more >>";
		learnElement.setAttribute("href", projectData.link);
		content.appendChild(learnElement);

		return element;
	}

	update(elapsedTime) {
		// Move the camera
		const speed = 0.5;
		let movement = new THREE.Vector3(0, 0, -speed);
		movement.applyAxisAngle(this.VECTOR3_UP, this.camera.rotation.y);
		this.camera.position.add(movement);

		// Move terrain to make it look infinite
		const threshold = this.terrainSize.y * 0.1;
		if (this.points.position.z - this.camera.position.z > threshold) {
			this.points.position.z -= threshold * 2;
		}

		this.fpsCounter.update();

		this.renderer.render(this.scene, this.camera);
	}

	updateColors() {
		const backgroundColor =
			utils.getCssColorAsThreeColor("--background-color");
		this.scene.background = backgroundColor;
		const fog = new THREE.Fog(backgroundColor, 40, 180);
		this.scene.fog = fog;

		this.pointsMaterial.uniforms.terrainColor.value.set(
			utils.getCssColorAsThreeColor("--terrain-color"),
		);
	}

	dispose() {
		this.scene.traverse((object) => {
			if (object.geometry) {
				object.geometry.dispose();
			}

			if (object.material) {
				if (Array.isArray(object.material)) {
					object.material.forEach((material) => {
						material.dispose();
					});
				} else {
					object.material.dispose();
				}
			}
		});

		this.renderer.dispose();

		window.removeEventListener("resize", this.onWindowResized);
	}
}
