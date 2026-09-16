import * as theme from "#src/theme.js";
import RAPIER from "@dimforge/rapier3d-compat";
import { InteractiveWorld } from "#src/interactive/interactiveWorld.js";
import { SimpleWorld } from "#src/simple/simpleWorld.js";
import { Shaders } from "#src/shaders.js";
import { Projects } from "#src/projects.js";

/**
 * Controlls site behavior.
 */
export class App {
	#settings;
	#canvasElement;
	#darkModeSwitch;
	#modeSwitch;
	#world;

	constructor() {
		this.#init();
	}

	async #init() {
		this.#settings = {
			interactive: false,
		};

		this.#canvasElement = document.querySelector("#terrain");
		this.#darkModeSwitch = document.querySelector("#dark-mode-switch");
		this.#modeSwitch = document.querySelector("#mode-switch");

		this.#world = null;

		await RAPIER.init();

		theme.initializeDarkMode();
		this.#darkModeSwitch.addEventListener("click", () => {
			theme.toggleDarkMode();

			this.#onDarkModeChanged(theme.getDarkMode());
		});

		this.#modeSwitch.addEventListener("click", () => {
			this.#settings.interactive = !this.#settings.interactive;

			this.setMode(this.#settings.interactive);
		});

		await Shaders.init();
		await Projects.init();

		this.changeWorld();
	}

	setMode(interactive) {
		this.#modeSwitch.textContent = interactive ? "Interactive" : "Simple";

		document.documentElement.classList.toggle("interactive", interactive);

		if (interactive) {
			this.#canvasElement.focus();
		}

		this.changeWorld();
	}

	#onDarkModeChanged(enabled) {
		this.#darkModeSwitch.textContent = enabled ? "Dark" : "Light";

		this.#world.updateColors();
	}

	changeWorld() {
		if (this.#world != null) {
			this.#world.dispose();
		}

		this.#world = this.#createWorld(this.#settings.interactive);
	}

	#createWorld(interactive) {
		let world;
		if (interactive) {
			world = new InteractiveWorld();
		} else {
			world = new SimpleWorld();
		}

		return world;
	}
}
