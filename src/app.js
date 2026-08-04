import RAPIER from "@dimforge/rapier3d-compat";
import { InteractiveWorld } from "#src/interactiveWorld.js";
import { SimpleWorld } from "#src/simpleWorld.js";
import { loadAsText } from '#src/utils.js';

export class App {
    constructor() {
        this.init();
    }

    async init() {
        this.settings = {
            darkMode: false,
            interactive: false,
        }
        
        this.canvasElement = document.querySelector("#terrain");
        this.darkModeSwitch = document.querySelector("#dark-mode-switch");
        this.modeSwitch = document.querySelector("#mode-switch");
        
        this.terrainVertexShader = await loadAsText("src/shaders/terrain.vert.glsl");
        this.terrainFragmentShader = await loadAsText("src/shaders/terrain.frag.glsl");

        this.world = null;

        await RAPIER.init();

        this.darkModeSwitch.addEventListener("click", () => {
            this.settings.darkMode = !this.settings.darkMode;
                        
            this.onDarkModeChanged(this.settings.darkMode);
        })

        this.modeSwitch.addEventListener("click", () => {
            this.settings.interactive = !this.settings.interactive;

            this.setMode(this.settings.interactive);
        })

        this.changeWorld();
    }

    setMode(interactive) {
        this.modeSwitch.textContent = interactive
        ? "Interactive"
        : "Simple";

        document.documentElement.classList.toggle("interactive", interactive);

        if (interactive) {
            this.canvasElement.focus();
        }

        this.changeWorld();
    }

    onDarkModeChanged(newValue) {
        this.darkModeSwitch.textContent = this.settings.darkMode 
        ? "Dark"
        : "Light";

        document.documentElement.classList.toggle("dark", this.settings.darkMode);

        this.world.updateColors();
    }

    changeWorld() {
        if (this.world != null) {
            this.world.dispose();
        }

        this.world = this.createWorld(this.settings.interactive);
    }

    createWorld(interactive) {
        let world;
        if (interactive) {
            world = new InteractiveWorld(this.terrainVertexShader, this.terrainFragmentShader);
        } else {
            world = new SimpleWorld(this.terrainVertexShader, this.terrainFragmentShader);
        }

        return world;
    }
}