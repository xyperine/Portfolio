import { SimpleWorld } from './src/simpleWorld.js';
import { InteractiveWorld } from './src/interactiveWorld.js';

const settings = {
    darkMode: false,
    interactive: false,
}

const mainElement = document.querySelector("main");
const darkModeSwitch = document.querySelector("#dark-mode-switch");
const modeSwitch = document.querySelector("#mode-switch");

let simpleWorld;
let interactiveWorld;

darkModeSwitch.addEventListener("click", () => {
    settings.darkMode = !settings.darkMode;
    
    document.documentElement.classList.toggle("dark", settings.darkMode);
    
    darkModeSwitch.textContent = settings.darkMode 
    ? "Dark"
    : "Light";
    
    onDarkModeChanged(settings.darkMode);
})

function onDarkModeChanged(newValue) {
    if (settings.interactive) {
        interactiveWorld.updateColors();
    } else {
        simpleWorld.updateColors();
    }
}

modeSwitch.addEventListener("click", () => {
    settings.interactive = !settings.interactive;
    
    modeSwitch.textContent = settings.interactive
    ? "Interactive"
    : "Simple";

    if (settings.interactive) {
        simpleWorld = null;
        init();
    } else {
        interactiveWorld = null;
        init();
    }
})


init();


function init() {
    if (settings.interactive) {
        interactiveWorld = new InteractiveWorld();
        window.addEventListener("resize", resize);
        interactiveWorld.resize(mainElement.clientWidth, mainElement.clientHeight);
    } else {
        simpleWorld = new SimpleWorld();
        window.addEventListener("resize", resize);
        simpleWorld.resize(mainElement.clientWidth, mainElement.clientHeight);
    }
}


function resize() {
    if (settings.interactive) {
        interactiveWorld.resize(mainElement.clientWidth, mainElement.clientHeight);
    } else {
        simpleWorld.resize(mainElement.clientWidth, mainElement.clientHeight);
    }
}

