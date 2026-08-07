import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Input } from '#src/input.js';
import { World } from '#src/world.js';
import { VertexShaderAlgorithmCopy } from '#src/vertexShaderAlgorithmCopy.js';
import { Glider } from '#src/glider.js';
import { FPSCounter } from '#src/fpsCounter.js';
import { getCssColorAsThreeColor } from '#src/utils.js';
import { Hud } from '#src/hud.js';

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
        this.shaderVertexAlgorithm = new VertexShaderAlgorithmCopy();
        this.terrainSize = new THREE.Vector2(600, 400);
        this.physicsDebug = false;
        if (this.physicsDebug) {
            this.terrainSize.set(10, 10);
        }
        
        // Scene
        const backgroundColor = getCssColorAsThreeColor("--background-color");
        this.scene = new THREE.Scene();
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        // Renderer
        this.renderingCanvas = document.querySelector("#terrain");
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.renderingCanvas,
            antialias: true,
        });
        this.renderer.setAnimationLoop(elapsedTime => {
            this.update(elapsedTime);
        });
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.add(this.camera);

        // Terrain
        const terrainGeometry = new THREE.PlaneGeometry(
            this.terrainSize.x, 
            this.terrainSize.y, 
            this.terrainSize.x, 
            this.terrainSize.y
        );
        
        // Points
        this.pointsMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
                {
                    time: {value: 0},
                    pointSize: {value: 0.2},
                    terrainColor: {value: getCssColorAsThreeColor("--terrain-color")}
                }
            ]),
            
            vertexShader: this.#terrainVertexShader,
            fragmentShader: this.#terrainFragmentShader,
            fog: true
        });
        this.points = new THREE.Points(terrainGeometry, this.pointsMaterial);
        this.points.rotation.set(
            -90 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.scene.add(this.points);
        
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
        
        // Setup physics
        this.physicsWorld = new RAPIER.World({
            x: 0,
            y: -9.81,
            z: 0
        });
        
        let q = this.points.getWorldQuaternion(new THREE.Quaternion());
        const terrainBodyDescription = RAPIER.RigidBodyDesc.fixed().setRotation({x: q.x, y: q.y, z: q.z, w: q.w});
        this.terrainBody = this.physicsWorld.createRigidBody(terrainBodyDescription);
        const terrainPhysicsMeshResolution = 0.1;
        this.simplifiedTerrainGeometry = new THREE.PlaneGeometry(
            this.terrainSize.x, 
            this.terrainSize.y,
            Math.round(this.terrainSize.x * terrainPhysicsMeshResolution),
            Math.round(this.terrainSize.y * terrainPhysicsMeshResolution)
        );
        this.applyDisplacement();
        const terrainColliderDescription = RAPIER.ColliderDesc.trimesh(this.simplifiedTerrainGeometry.attributes.position.array, this.simplifiedTerrainGeometry.index.array);
        const terrainCollider = this.physicsWorld.createCollider(terrainColliderDescription, this.terrainBody);
        
        // Glider
        this.glider = new Glider(this.camera, this.input, this.scene, this.physicsWorld);

        if (this.physicsDebug) {
            this.debugPhysics();
        }

        this.hud = new Hud(this.glider);

        this.fpsCounter = new FPSCounter();
    }

    applyDisplacement() {
        let vertices = this.simplifiedTerrainGeometry.attributes.position;
        let vertex = new THREE.Vector3();
        for (let i = 0; i < vertices.count; i++) {
            vertex.fromBufferAttribute(vertices, i);
            let vertexWS = this.points.localToWorld(vertex.clone());
            let height = this.shaderVertexAlgorithm.getHeight(vertexWS.x, vertexWS.z);

            vertices.setZ(i, height);
        }

        vertices.needsUpdate = true;
    }

    debugPhysics() {
        let q = this.points.getWorldQuaternion(new THREE.Quaternion());
        const terrainColliderDesc = RAPIER.ColliderDesc.trimesh(this.simplifiedTerrainGeometry.attributes.position.array, this.simplifiedTerrainGeometry.index.array);
        const terrainCollider = this.physicsWorld.createCollider(terrainColliderDesc, this.terrainBody);

        let {vertices, colors} = this.physicsWorld.debugRender();

        console.log(vertices.length);
        console.log(vertices.slice(0, 20));
        console.log(colors.length);

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

        // Move terrain to make it look infinite
        const threshold = this.terrainSize.y * 0.1;
        if (this.points.position.z - this.glider.root.position.z > threshold) {
            this.points.position.z -= threshold * 2;
            this.applyDisplacement();
        }
        
        // Update the shader
        this.pointsMaterial.uniforms.time.value = elapsedTime;
        
        this.hud.update();

        this.fpsCounter.update();

        this.renderer.render(this.scene, this.camera);
    }

    postUpdate() {
        this.input.update();
    }

    updateColors() {
        const backgroundColor = getCssColorAsThreeColor("--background-color");
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        this.pointsMaterial.uniforms.terrainColor.value.set(getCssColorAsThreeColor("--terrain-color"));
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