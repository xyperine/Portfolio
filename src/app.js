import { InteractiveWorld } from "#src/interactiveWorld.js";
import { SimpleWorld } from "#src/simpleWorld.js";


export class App {
    constructor() {
        this.settings = {
            darkMode: false,
            interactive: false,
        }

        this.darkModeSwitch = document.querySelector("#dark-mode-switch");
        this.modeSwitch = document.querySelector("#mode-switch");

        this.world = null;

        this.darkModeSwitch.addEventListener("click", () => {
            this.settings.darkMode = !this.settings.darkMode;
            
            document.documentElement.classList.toggle("dark", this.settings.darkMode);
            
            this.darkModeSwitch.textContent = this.settings.darkMode 
            ? "Dark"
            : "Light";
            
            this.onDarkModeChanged(this.settings.darkMode);
        })

        this.modeSwitch.addEventListener("click", () => {
            this.settings.interactive = !this.settings.interactive;
            
            this.modeSwitch.textContent = this.settings.interactive
            ? "Interactive"
            : "Simple";

            this.init();
        })

        this.init();
    }

    onDarkModeChanged(newValue) {
        this.world.updateColors();
    }

    init() {
        this.world = this.createWorld(this.settings.interactive);
    }

    createWorld(interactive) {
        let world;
        if (interactive) {
            world = new InteractiveWorld();
        } else {
            world = new SimpleWorld();
        }

        return world;
    }
}