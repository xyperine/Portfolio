import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import * as utils from '#src/utils.js';
import { Input } from '#src/input.js';
import { World } from '#src/world.js';
import { Glider } from '#src/glider.js';
import { FPSCounter } from '#src/fpsCounter.js';
import { Hud } from '#src/hud.js';
import { Terrain } from '#src/terrain.js';
import { TemperatureMap } from '#src/temperatureMap.js';
import { PlanetGenerator } from '#src/planetGenerator.js';

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
        this.input = new Input();
        this.physicsDebug = false;
        this.renderingDistance = 180;

        this.planetGenerator = new PlanetGenerator();
        this.planetInfo = this.planetGenerator.generate();

        this.gravity = utils.randGaussianConstrained(0.2, 4, 1, 1);
        
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
        
        this.terrain = new Terrain(this.scene, this.physicsWorld, this.#terrainVertexShader, this.#terrainFragmentShader, this.renderingDistance);
        this.temperatureMap = new TemperatureMap(this.planetInfo);

        // Make sure the terrain collider is registered.
        this.physicsWorld.step();

        this.glider = new Glider(this.camera, this.input, this.scene, this.physicsWorld, this.temperatureMap);

        this.hud = new Hud(this.glider, this.planetInfo.name, this.gravity);

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
        this.glider.render(elapsedTime);
        
        this.terrain.update(this.glider.getRenderPosition());
        this.terrain.render(elapsedTime);

        this.hud.update();

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

    dispose() {
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