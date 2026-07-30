import * as THREE from 'three';
import Renderer from 'three/src/renderers/common/Renderer.js';

const VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
const VECTOR3_UP = new THREE.Vector3(0, 1, 0);
const VECTOR3_FORWARD = new THREE.Vector3(0, 0, 1);

// Scene
const backgroundColor = new THREE.Color(
    getComputedStyle(document.documentElement)
    .getPropertyValue("--background-color")
    .trim()
    );
const scene = new THREE.Scene();
scene.background = backgroundColor;
const fog = new THREE.Fog(backgroundColor, 30, 180);
scene.fog = fog;

// Camera
const cameraRotation = new THREE.Vector3(
    -15 * THREE.MathUtils.DEG2RAD, 
    0 * THREE.MathUtils.DEG2RAD, 
    0 * THREE.MathUtils.DEG2RAD
);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 6);
camera.rotateOnWorldAxis(VECTOR3_RIGHT, cameraRotation.x);
camera.rotateOnWorldAxis(VECTOR3_UP, cameraRotation.y);
camera.rotateOnWorldAxis(VECTOR3_FORWARD, cameraRotation.z);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#terrain"),
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Terrain
const terrainSize = new THREE.Vector2(600, 400);
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
const pointsMaterial = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
            time: {value: 0},
            pointSize: {value: 0.2}
        }
    ]),

    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
    fog: true
});
const points = new THREE.Points(terrainGeometry, pointsMaterial);
points.rotation.set(
    -90 * THREE.MathUtils.DEG2RAD, 
    0 * THREE.MathUtils.DEG2RAD, 
    0 * THREE.MathUtils.DEG2RAD
);
scene.add(points);

const timer = new THREE.Timer();

function animate(deltaTime) {
    const speed = 1;
    let movement = new THREE.Vector3(0, 0, -speed);
    movement.applyAxisAngle(VECTOR3_UP, cameraRotation.y);
    camera.position.add(movement);

    const threshold = terrainSize.y * 0.1;
    if (points.position.z - camera.position.z > threshold) {
        points.position.z -= threshold * 2;
    }

    timer.update();
    const time = timer.getElapsed();

    pointsMaterial.uniforms.time.value = time;

    const cameraY = 30;
    camera.position.setY(cameraY);

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

const mainElement = document.querySelector("main");

function resize() {
    const width = mainElement.clientWidth;
    const height = mainElement.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();