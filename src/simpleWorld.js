import * as THREE from 'three';
import { World } from '#src/world.js';

export class SimpleWorld extends World {
    constructor() {
        super();
    }

    init() {
        this.terrainSize = new THREE.Vector2(600, 400);

        const backgroundColor = this.getCssColor("--background-color");
        this.scene = new THREE.Scene();
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        // Camera
        const cameraRotation = new THREE.Vector3(
            -15 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 30, 6);
        this.camera.rotateOnWorldAxis(this.VECTOR3_RIGHT, cameraRotation.x);
        this.camera.rotateOnWorldAxis(this.VECTOR3_UP, cameraRotation.y);
        this.camera.rotateOnWorldAxis(this.VECTOR3_FORWARD, cameraRotation.z);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector("#terrain"),
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(elapsedTime => {
            this.update(elapsedTime);
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
        }
        window.addEventListener("resize", this.onWindowResized);
        this.resize(this.mainElement.clientWidth, this.mainElement.clientHeight);
    }

    update(elapsedTime) {
        // Move the camera
        const speed = 0.5;
        let movement = new THREE.Vector3(0, 0, -speed);
        movement.applyAxisAngle(this.VECTOR3_UP, this.camera.rotation.y);
        this.camera.position.add(movement);
        
        // Move terrain to make it look infinite
        const threshold = this.terrainSize.y * 0.1;
        if (this.points.position.z - this.camera.position.z > threshold) {
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

        window.removeEventListener("resize", this.onWindowResized);
    }
}