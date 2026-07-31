import * as THREE from 'three';

const VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
const VECTOR3_UP = new THREE.Vector3(0, 1, 0);
const VECTOR3_FORWARD = new THREE.Vector3(0, 0, 1);

const settings = {
    darkMode: false,
    interactive: false,
}

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
        ? "Simple"
        : "Interactive";
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
    const cameraRotation = new THREE.Vector3(
        -15 * THREE.MathUtils.DEG2RAD, 
        0 * THREE.MathUtils.DEG2RAD, 
        0 * THREE.MathUtils.DEG2RAD
    );
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 6);
    camera.rotateOnWorldAxis(VECTOR3_RIGHT, cameraRotation.x);
    camera.rotateOnWorldAxis(VECTOR3_UP, cameraRotation.y);
    camera.rotateOnWorldAxis(VECTOR3_FORWARD, cameraRotation.z);

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
    const vertices = terrainGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const y = vertices.getY(i);
        const offsetMax = 0.1;
        vertices.setX(i, x + THREE.MathUtils.randFloat(-offsetMax, offsetMax));
        vertices.setY(i, y + THREE.MathUtils.randFloat(-offsetMax, offsetMax));
    }

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
    const speed = 1;
    let movement = new THREE.Vector3(0, 0, -speed);
    movement.applyAxisAngle(VECTOR3_UP, camera.rotation.y);
    camera.position.add(movement);

    // Move terrain to make it look infinite
    const threshold = terrainSize.y * 0.1;
    if (points.position.z - camera.position.z > threshold) {
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