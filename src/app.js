import RAPIER from "@dimforge/rapier3d-compat";
import { InteractiveWorld } from "#src/interactive/interactiveWorld.js";
import { SimpleWorld } from "#src/simple/simpleWorld.js";
import { Shaders } from "#src/shaders.js";

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
            darkMode: false,
            interactive: false,
        }
        
        this.#canvasElement = document.querySelector("#terrain");
        this.#darkModeSwitch = document.querySelector("#dark-mode-switch");
        this.#modeSwitch = document.querySelector("#mode-switch");

        this.#world = null;

        await RAPIER.init();

        this.#darkModeSwitch.addEventListener("click", () => {
            this.#settings.darkMode = !this.#settings.darkMode;
                        
            this.#onDarkModeChanged(this.#settings.darkMode);
        })

        this.#modeSwitch.addEventListener("click", () => {
            this.#settings.interactive = !this.#settings.interactive;

            this.setMode(this.#settings.interactive);
        })

        await Shaders.init();

        this.changeWorld();
    }

    setMode(interactive) {
        this.#modeSwitch.textContent = interactive
        ? "Interactive"
        : "Simple";

        document.documentElement.classList.toggle("interactive", interactive);

        if (interactive) {
            this.#canvasElement.focus();
        }

        this.changeWorld();
    }

    #onDarkModeChanged(newValue) {
        this.#darkModeSwitch.textContent = this.#settings.darkMode 
        ? "Dark"
        : "Light";

        document.documentElement.classList.toggle("dark", this.#settings.darkMode);

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