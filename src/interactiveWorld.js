import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Input } from '#src/input.js';
import { World } from '#src/world.js';
import { VertexShaderAlgorithmCopy } from '#src/vertexShaderAlgorithmCopy.js';
import { Glider } from '#src/glider.js';
import { FPSCounter } from '#src/fpsCounter.js';
import { getCssColorAsThreeColor } from '#src/utils.js';
import { Hud } from '#src/hud.js';
import { fract } from 'three/src/nodes/math/MathNode.js';
import { TerrainChunk } from '#src/terrainChunk.js';

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
        
        // Terrain
        this.chunkMap = new Map();
        this.chunkSize = {w: 180, d: 180};
        this.chunkGeometry = new THREE.PlaneGeometry(
            this.chunkSize.w, 
            this.chunkSize.d, 
            this.chunkSize.w, 
            this.chunkSize.d
        );
        this.chunkMaterial = new THREE.ShaderMaterial({
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
        this.loadChunk(0, 0);

        // Glider
        this.glider = new Glider(this.camera, this.input, this.scene, this.physicsWorld);

        if (this.physicsDebug) {
            this.debugPhysics();
        }

        this.hud = new Hud(this.glider);

        this.fpsCounter = new FPSCounter();
    }

    createChunk(chunkGeometry, chunkMaterial, x, z) {
        console.debug(this.chunkMap);
        const points = new THREE.Points(chunkGeometry, chunkMaterial);
        points.position.set(x * this.chunkSize.w, 0, z * this.chunkSize.d);
        points.rotation.set(
            -90 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.scene.add(points);            

        let q = points.getWorldQuaternion(new THREE.Quaternion());
        let p = points.getWorldPosition(new THREE.Vector3());
        const bodyDescription = RAPIER.RigidBodyDesc.fixed().setRotation({
            x: q.x, y: q.y, z: q.z, w: q.w
        }).setTranslation(p.x, p.y, p.z);

        const body = this.physicsWorld.createRigidBody(bodyDescription);
        const physicsMeshResolution = 0.1;
        const physicsGeometry = new THREE.PlaneGeometry(
            this.chunkSize.w, 
            this.chunkSize.d,
            Math.round(this.chunkSize.w * physicsMeshResolution),
            Math.round(this.chunkSize.d * physicsMeshResolution)
        );
        this.applyDisplacement(physicsGeometry, points.matrixWorld, body);

        const chunk = new TerrainChunk(points, body);
        return chunk;
    }

    applyDisplacement(geometry, ltwMatrix, rb) {
        let vertices = geometry.attributes.position;
        let vertex = new THREE.Vector3();
        for (let i = 0; i < vertices.count; i++) {
            vertex.fromBufferAttribute(vertices, i);
            let vertexWS = vertex.clone().applyMatrix4(ltwMatrix);
            let height = this.shaderVertexAlgorithm.getHeight(vertexWS.x, vertexWS.z);

            vertices.setZ(i, height);
        }
        
        vertices.needsUpdate = true;

        const colliderDescription = RAPIER.ColliderDesc.trimesh(geometry.attributes.position.array, geometry.index.array);
        while (rb.numColliders() > 0) {
            this.physicsWorld.removeCollider(rb.collider(0), true);
        }
        const collider = this.physicsWorld.createCollider(colliderDescription, rb);
    }

    debugPhysics() {
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

        const rawX = this.glider.getXZPosition().x / this.chunkSize.w;
        const rawZ = this.glider.getXZPosition().z / this.chunkSize.d;
        const chunkX = fract(rawX);
        const chunkZ = fract(rawZ);
        const px = Math.floor(this.glider.getXZPosition().x / this.chunkSize.w);
        const pz = Math.floor(this.glider.getXZPosition().z / this.chunkSize.d);
        for (let x = px - 1; x <= px + 1; x++) {
            for (let z = pz - 1; z <= pz + 1; z++) {
                this.loadChunk(x, z);
            }            
        }

        this.physicsWorld.step();
        
        if (this.physicsDebug) {
            if (this.input.isKeyDown("KeyQ")) {
                this.debugPhysics();
            }
        }
    }

    // Load chunk at x and z chunk coordinate.
    // If chunk already exists at x z
    //  do nothing
    // else
    //  try to get chunks that are too far
    //  if found old chunk that is too far
    //      reuse old chunk
    //  else
    //      create new chunk
    loadChunk(x, z) {
        const key = `${x},${z}`;
        if (!this.chunkMap.has(key)) {
            const chunkKey = this.getFarChunk(x, z);
            let chunk = this.chunkMap.get(chunkKey);
            if (chunk != null) {
                if (chunkKey !== key) { 
                    chunk.relocateTo(x * this.chunkSize.w, z * this.chunkSize.d);
                    const simplifiedTerrainGeometry = new THREE.PlaneGeometry(
                        this.chunkSize.w, 
                        this.chunkSize.d,
                        Math.round(this.chunkSize.w * 0.1),
                        Math.round(this.chunkSize.d * 0.1)
                    );
                    this.applyDisplacement(simplifiedTerrainGeometry, chunk.renderObject.matrixWorld, chunk.physicsObject);
                    console.log(key);
                    this.chunkMap.set(key, chunk);
                    const deletedSuccessfully = this.chunkMap.delete(chunkKey);
                }
            } else {
                chunk = this.createChunk(this.chunkGeometry, this.chunkMaterial, x, z);
                this.chunkMap.set(key, chunk);
            }
        }
    }

    getFarChunk(x, z) {
        let maxDist = 0;
        let chunkKey = null;
        if (this.chunkMap.size > 0) {
            this.chunkMap.forEach((v, k) => {
                const cx = Number.parseInt(k.split(",")[0]);
                const cz = Number.parseInt(k.split(",")[1]);
    
                if (Math.abs(x - cx) >= 3 || Math.abs(z - cz) >= 3) {
                    let dx = Math.abs(x - cx);
                    dx *= dx;
                    let dz = Math.abs(z - cz);
                    dz *= dz;
                    const sqDist = dx + dz;
                    if (sqDist > maxDist) {
                        maxDist = sqDist;
                        chunkKey = k;
                    }
                }
            });
        }

        return chunkKey;
    }
    
    syncPhysicsAndRendering() {
        this.glider.sync();
    }

    render(elapsedTime) {
        this.glider.render(elapsedTime);
        
        // Update the shader
        this.chunkMaterial.uniforms.time.value = elapsedTime;
        
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
        
        this.chunkMaterial.uniforms.terrainColor.value.set(getCssColorAsThreeColor("--terrain-color"));
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