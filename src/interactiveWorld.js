import * as THREE from 'three';
import { Input } from '#src/input.js';
import { World } from '#src/world.js';

export class InteractiveWorld extends World {
    constructor() {
        super();
    }

    init() {
        this.input = new Input();
        this.terrainSize = new THREE.Vector2(600, 400);
        
        // Scene
        const backgroundColor = this.getCssColor("--background-color");
        this.scene = new THREE.Scene();
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        // Camera
        this.glider = new THREE.Object3D();
        this.scene.add(this.glider);
        this.glider.position.set(0, 30, 6);
        this.cameraSocket = new THREE.Object3D();
        this.glider.add(this.cameraSocket);
        this.cameraSocket.position.set(0, 0, 0);
        this.cameraSocket.rotation.set(0, 0, 0);
        const cameraRotation = new THREE.Vector3(
            -15 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraSocket.add(this.camera);
        this.camera.rotateOnWorldAxis(this.VECTOR3_RIGHT, cameraRotation.x);
        this.camera.rotateOnWorldAxis(this.VECTOR3_UP, cameraRotation.y);
        this.camera.rotateOnWorldAxis(this.VECTOR3_FORWARD, cameraRotation.z);
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector("#terrain"),
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(elapsedTime => {
            this.render(elapsedTime);
        });
        
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
                    terrainColor: {value: this.getCssColor("--terrain-color")}
                }
            ]),
            
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("fragmentShader").textContent,
            fog: true
        });
        this.points = new THREE.Points(terrainGeometry, this.pointsMaterial);
        this.points.rotation.set(
            -90 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.scene.add(this.points);
        
        this.mainElement = document.querySelector("main");
        this.onWindowResized = () => {
            this.resize(this.mainElement.clientWidth, this.mainElement.clientHeight);
        };
        window.addEventListener("resize", this.onWindowResized);
        this.resize(this.mainElement.clientWidth, this.mainElement.clientHeight);
        
        this.onMouseClickCanvas = () => {
            this.renderer.domElement.requestPointerLock();
        };
        this.mainElement.addEventListener("click", this.onMouseClickCanvas);
        this.renderer.domElement.requestPointerLock();

        this.lookRotation = new THREE.Vector3();
        this.onMouseMoved = event => {
            if (document.pointerLockElement != null) {
                this.lookRotation.x += -event.movementY * 0.002;
                this.lookRotation.y += -event.movementX * 0.002;
                this.lookRotation.z = 0;
            
                this.lookRotation.x = THREE.MathUtils.clamp(this.lookRotation.x, -Math.PI * 0.5, Math.PI * 0.5);
            }
        }
        document.addEventListener("mousemove", this.onMouseMoved);
    }
    
    render(elapsedTime) {
        // Move the camera
        const speed = 0.5;
        const movement = new THREE.Vector3();
        if (this.input.isKeyDown("KeyW")) {
            movement.z += -speed;
        }
        if (this.input.isKeyDown("KeyS")) {
            movement.z += speed;
        }
        if (this.input.isKeyDown("KeyD")) {
            movement.x += speed;
        }
        if (this.input.isKeyDown("KeyA")) {
            movement.x += -speed;
        }
        
        movement.normalize();
        movement.multiplyScalar(speed);
        
        if (this.input.isKeyDown("Space")) {
            movement.y += speed;
        }
        if (this.input.isKeyDown("ShiftLeft")) {
            movement.y += -speed;
        }
        
        movement.applyAxisAngle(this.VECTOR3_UP, this.glider.rotation.y);
        this.glider.position.add(movement);
        this.cameraSocket.rotation.x = this.lookRotation.x
        this.glider.rotation.y = this.lookRotation.y;

        // Move terrain to make it look infinite
        const threshold = this.terrainSize.y * 0.1;
        if (this.points.position.z - this.glider.position.z > threshold) {
            this.points.position.z -= threshold * 2;
        }
        
        // Update the shader
        this.pointsMaterial.uniforms.time.value = elapsedTime;
        
        this.renderer.render(this.scene, this.camera);
    }

    updateColors() {
        const backgroundColor = this.getCssColor("--background-color");
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        this.pointsMaterial.uniforms.terrainColor.value.set(this.getCssColor("--terrain-color"));
    }

    dispose() {
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

        this.renderer.dispose();
        this.input.dispose();

        this.mainElement.removeEventListener("click", this.onMouseClickCanvas);
        window.removeEventListener("resize", this.onWindowResized);
        document.removeEventListener("mousemove", this.onMouseMoved);
    }
}