import * as THREE from 'three';
import { Input } from './src/input.js';

const VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
const VECTOR3_UP = new THREE.Vector3(0, 1, 0);
const VECTOR3_FORWARD = new THREE.Vector3(0, 0, 1);

const settings = {
    darkMode: false,
    interactive: false,
}

const input = new Input();

const lookRotation = new THREE.Vector3();
const glider = new THREE.Object3D();
const cameraSocket = new THREE.Object3D();

document.addEventListener("mousemove", event => {
    lookRotation.x += -event.movementY * 0.002;
    lookRotation.y += -event.movementX * 0.002;
    lookRotation.z = 0;

    lookRotation.x = THREE.MathUtils.clamp(lookRotation.x, -Math.PI * 0.5, Math.PI * 0.5);
})

const mainElement = document.querySelector("main");
const darkModeSwitch = document.querySelector("#dark-mode-switch");
const modeSwitch = document.querySelector("#mode-switch");
const terrainSize = new THREE.Vector2(600, 400);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera();
let renderer = new THREE.WebGLRenderer();
let points = new THREE.Points();
let pointsMaterial = new THREE.ShaderMaterial();


darkModeSwitch.addEventListener("click", () => {
    settings.darkMode = !settings.darkMode;
    
    document.documentElement.classList.toggle("dark", settings.darkMode);
    
    darkModeSwitch.textContent = settings.darkMode 
    ? "Dark"
    : "Light";
    
    onDarkModeChanged(settings.darkMode);
})

function onDarkModeChanged(newValue) {
    const backgroundColor = getCssColor("--background-color");
    scene.background = backgroundColor;
    const fog = new THREE.Fog(backgroundColor, 30, 180);
    scene.fog = fog;
    
    pointsMaterial.uniforms.terrainColor.value.set(getCssColor("--terrain-color"));
}

modeSwitch.addEventListener("click", () => {
    settings.interactive = !settings.interactive;
    
    modeSwitch.textContent = settings.interactive
    ? "Interactive"
    : "Simple";
})


function getCssColor(name) {
    return new THREE.Color(
        getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim()
    );
}


init();


function init() {
    // Scene
    const backgroundColor = getCssColor("--background-color");
    scene = new THREE.Scene();
    scene.background = backgroundColor;
    const fog = new THREE.Fog(backgroundColor, 30, 180);
    scene.fog = fog;
    
    // Camera
    scene.add(glider);
    glider.position.set(0, 30, 6);
    glider.add(cameraSocket);
    cameraSocket.position.set(0, 0, 0);
    cameraSocket.rotation.set(0, 0, 0);
    const cameraRotation = new THREE.Vector3(
        -15 * THREE.MathUtils.DEG2RAD, 
        0 * THREE.MathUtils.DEG2RAD, 
        0 * THREE.MathUtils.DEG2RAD
    );
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraSocket.add(camera);
    camera.rotateOnWorldAxis(VECTOR3_RIGHT, cameraRotation.x);
    camera.rotateOnWorldAxis(VECTOR3_UP, cameraRotation.y);
    camera.rotateOnWorldAxis(VECTOR3_FORWARD, cameraRotation.z);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#terrain"),
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(render);
    
    // Terrain
    const terrainGeometry = new THREE.PlaneGeometry(
        terrainSize.x, terrainSize.y, terrainSize.x, terrainSize.y);
        
        // Points
        pointsMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
            {
                time: {value: 0},
                pointSize: {value: 0.2},
                terrainColor: {value: getCssColor("--terrain-color")}
            }
        ]),
        
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
        fog: true
    });
    points = new THREE.Points(terrainGeometry, pointsMaterial);
    points.rotation.set(
        -90 * THREE.MathUtils.DEG2RAD, 
        0 * THREE.MathUtils.DEG2RAD, 
        0 * THREE.MathUtils.DEG2RAD
    );
    scene.add(points);
    
    window.addEventListener("resize", resize);
    resize();
}


function render(elapsedTime) {
    // Move the camera
    if (settings.interactive) {
        const speed = 0.5;
        const movement = new THREE.Vector3();
        if (input.isKeyDown("KeyW")) {
            movement.z += -speed;
        }
        if (input.isKeyDown("KeyS")) {
            movement.z += speed;
        }
        if (input.isKeyDown("KeyD")) {
            movement.x += speed;
        }
        if (input.isKeyDown("KeyA")) {
            movement.x += -speed;
        }
        
        movement.normalize();
        movement.multiplyScalar(speed);
        
        if (input.isKeyDown("Space")) {
            movement.y += speed;
        }
        if (input.isKeyDown("ShiftLeft")) {
            movement.y += -speed;
        }
        
        movement.applyAxisAngle(VECTOR3_UP, glider.rotation.y);
        glider.position.add(movement);
        cameraSocket.rotation.x = lookRotation.x
        glider.rotation.y = lookRotation.y;

        console.log(cameraSocket.position.y);
    }
    else {
        const speed = 0.5;
        let movement = new THREE.Vector3(0, 0, -speed);
        movement.applyAxisAngle(VECTOR3_UP, glider.rotation.y);
        glider.position.add(movement);
    }
    
    // Move terrain to make it look infinite
    const threshold = terrainSize.y * 0.1;
    if (points.position.z - glider.position.z > threshold) {
        points.position.z -= threshold * 2;
    }
    
    // Update the shader
    pointsMaterial.uniforms.time.value = elapsedTime;
    
    renderer.render(scene, camera);
}


function resize() {
    const width = mainElement.clientWidth;
    const height = mainElement.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

