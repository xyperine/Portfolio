import { SimpleWorld } from '#src/simpleWorld.js';
import { InteractiveWorld } from '#src/interactiveWorld.js';

export class App {
    constructor() {
        this.settings = {
            darkMode: false,
            interactive: false,
        }

        this.darkModeSwitch = document.querySelector("#dark-mode-switch");
        this.modeSwitch = document.querySelector("#mode-switch");

        this.simpleWorld;
        this.interactiveWorld;

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

            if (this.settings.interactive) {
                this.simpleWorld = null;
                this.init();
            } else {
                this.interactiveWorld = null;
                this.init();
            }
        })

        this.init();
    }

    
    onDarkModeChanged(newValue) {
        if (this.settings.interactive) {
            this.interactiveWorld.updateColors();
        } else {
            this.simpleWorld.updateColors();
        }
    }


    init() {
        if (this.settings.interactive) {
            this.interactiveWorld = new InteractiveWorld();
        } else {
            this.simpleWorld = new SimpleWorld();
        }
    }
}