import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import * as SEEDRANDOM from 'seedrandom';
import * as utils from '#src/utils.js';
import { Input } from '#src/interactive/input.js';
import { World } from '#src/world.js';
import { Glider } from '#src/interactive/glider.js';
import { FPSCounter } from '#src/fpsCounter.js';
import { Hud } from '#src/interactive/ui/hud.js';
import { Terrain } from '#src/interactive/worldGeneration/terrain.js';
import { TemperatureMap } from '#src/interactive/worldGeneration/temperatureMap.js';
import { PlanetGenerator } from '#src/interactive/worldGeneration/planetGenerator.js';
import { Compass } from '#src/interactive/ui/compass.js';
import { Projects } from '#src/interactive/projects.js';
import { Interactables } from '#src/interactive/interactions/interactables.js';

export class InteractiveWorld extends World {
    #terrainVertexShader;
    #terrainFragmentShader;

    constructor(terrainVertexShader, terrainFragmentShader) {
        super();

        this.#terrainVertexShader = terrainVertexShader;
        this.#terrainFragmentShader = terrainFragmentShader;

        this.init();
    }
    
    async init() {
        await Projects.init();
        Interactables.init();

        this.input = new Input();
        this.physicsDebug = false;
        this.renderingDistance = 180;
        
        this.random = new Math.seedrandom();

        this.planetGenerator = new PlanetGenerator(this.random());
        this.planetInfo = this.planetGenerator.generate();

        this.gravity = utils.seededGaussianConstrained(this.random, 0.2, 4, 1, 1);
        
        // Scene
        const backgroundColor = utils.getCssColorAsThreeColor("--background-color");
        this.scene = new THREE.Scene();
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 40, this.renderingDistance);
        this.scene.fog = fog;
        
        // Renderer
        this.renderingCanvas = document.querySelector("#terrain");
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.renderingCanvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setAnimationLoop(elapsedTime => {
            this.update(elapsedTime);
        });
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, this.renderingDistance);
        this.scene.add(this.camera);
        
        // Events
        this.gameElement = document.querySelector("#game");
        this.onWindowResized = () => {
            this.resize(this.gameElement.clientWidth, this.gameElement.clientHeight);
        };
        window.addEventListener("resize", this.onWindowResized);
        this.onWindowResized();
        
        this.mainElement = document.querySelector("main");
        this.onMouseClickCanvas = async () => {
            await this.input.requestPointerLock(this.renderingCanvas);
        };
        this.mainElement.addEventListener("click", this.onMouseClickCanvas);
        this.onMouseClickCanvas();
        
        this.onPointerLockChange = () => {
            const pointerLocked = document.pointerLockElement != null;
            document.documentElement.classList.toggle("pointer-locked", pointerLocked);
        }
        document.addEventListener("pointerlockchange", this.onPointerLockChange);
        
        this.physicsWorld = new RAPIER.World({
            x: 0,
            y: -9.81 * this.gravity,
            z: 0
        });

        this.terrain = new Terrain(
            this.scene, 
            this.physicsWorld, 
            this.#terrainVertexShader, 
            this.#terrainFragmentShader, 
            this.renderingDistance, 
            this.random().toString()
        );
        this.temperatureMap = new TemperatureMap(this.planetInfo, this.random().toString());

        // Make sure the terrain collider is registered.
        this.physicsWorld.step();

        this.glider = new Glider(this.camera, this.input, this.scene, this.physicsWorld, this.temperatureMap);

        this.hud = new Hud(this.glider, this.planetInfo.name, this.gravity);
        this.compass = new Compass();

        for (let beacon of this.terrain.beaconPlacements) {
            this.compass.trackBeacon(beacon);
        }

        // Diagnostics
        if (this.physicsDebug) {
            this.debugPhysics();
        }

        this.fpsCounter = new FPSCounter();
    }

    debugPhysics() {
        let {vertices, colors} = this.physicsWorld.debugRender();

        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        g.setAttribute("color", new THREE.BufferAttribute(colors, 4));

        const m = new THREE.LineBasicMaterial({
            vertexColors: true
        })

        const mesh = new THREE.LineSegments(g, m);
        this.scene.add(mesh);
    }
    
    update(elapsedTime) {
        this.processInputs();

        this.processPhysics();

        this.syncPhysicsAndRendering();

        this.render(elapsedTime);

        this.postUpdate();
    }

    processInputs() {
        this.glider.processInputs();
    }

    processPhysics() {
        // Move the glider
        this.glider.processPhysics();

        this.physicsWorld.step();

        if (this.physicsDebug) {
            if (this.input.isKeyDown("KeyQ")) {
                this.debugPhysics();
            }
        }
    }
    
    syncPhysicsAndRendering() {
        this.glider.sync();
    }

    render(elapsedTime) {
        const gameState = {
            elapsedTime, 
            camera: this.camera
        };

        this.glider.render(elapsedTime);
        
        this.terrain.update(this.glider.getRenderPosition());
        this.terrain.render(gameState);

        this.hud.update();
        this.compass.update(gameState)

        this.fpsCounter.update();

        this.renderer.render(this.scene, this.camera);
    }

    postUpdate() {
        this.input.update();
    }

    updateColors() {
        const backgroundColor = utils.getCssColorAsThreeColor("--background-color");
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        this.terrain.updateColors();
    }

    resize(width, height) {
        super.resize(width, height);

        if (this.compass !== undefined) {
            this.compass.resize();
        }
    }

    dispose() {
        Interactables.dispose();

        this.input.unlockPointer();
        
        // Unsubscribe
        this.mainElement.removeEventListener("click", this.onMouseClickCanvas);
        window.removeEventListener("resize", this.onWindowResized);
        document.removeEventListener("mousemove", this.onMouseMoved);
        document.removeEventListener("pointerlockchange", this.onPointerLockChange);

        // Dispose objects
        this.glider.dispose();
        this.glider = null;
        this.input.dispose();
        this.input = null;
        this.compass.dispose();
        this.compass = null;
        
        // Dispose rendering
        this.scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        material.dispose();
                    });
                } else {
                    object.material.dispose();
                }
            }
        });
        this.scene = null;

        this.renderer.dispose();
        this.renderer = null;

        // Dispose physics
        this.physicsWorld.free();
        this.physicsWorld = null;
    }
}