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
                        
            this.onDarkModeChanged(this.settings.darkMode);
        })

        this.modeSwitch.addEventListener("click", () => {
            this.settings.interactive = !this.settings.interactive;

            this.setMode(this.settings.interactive);
        })

        this.init();
    }

    setMode(interactive) {
        this.modeSwitch.textContent = this.settings.interactive
        ? "Interactive"
        : "Simple";

        document.documentElement.classList.toggle("interactive", interactive);

        this.init();
    }

    onDarkModeChanged(newValue) {
        this.darkModeSwitch.textContent = this.settings.darkMode 
        ? "Dark"
        : "Light";

        document.documentElement.classList.toggle("dark", this.settings.darkMode);

        this.world.updateColors();
    }

    init() {
        if (this.world != null) {
            this.world.dispose();
        }

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