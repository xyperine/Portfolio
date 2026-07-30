import * as THREE from 'three';
import Renderer from 'three/src/renderers/common/Renderer.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

const VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
const VECTOR3_UP = new THREE.Vector3(0, 1, 0);
const VECTOR3_FORWARD = new THREE.Vector3(0, 0, 1);

const mainElement = document.querySelector("main");

// Scene
const backgroundColor = new THREE.Color().setHSL(0, 0, 0.93);
const scene = new THREE.Scene();
scene.background = backgroundColor;
const fog = new THREE.Fog(backgroundColor, 10, 100);
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
const terrainSize = new THREE.Vector2(200, 200);
const terrainGeometry = new THREE.PlaneGeometry(
    terrainSize.x, terrainSize.y, terrainSize.x, terrainSize.y);
const vertices = terrainGeometry.attributes.position;
for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const y = vertices.getY(i);
    vertices.setX(i, x + THREE.MathUtils.randFloat(-0.1, 0.1));
    vertices.setY(i, y + THREE.MathUtils.randFloat(-0.1, 0.1));
}
terrainGeometry.computeVertexNormals();

// Points
const pointsColor = new THREE.Color().setHSL(0, 0, 0.05);
const pointsMaterial = new THREE.PointsMaterial( {
    color: pointsColor,
    size: 0.1
});
const points = new THREE.Points(terrainGeometry, pointsMaterial);
points.position.set(0, 0, 0);
points.rotation.set(
    -90 * THREE.MathUtils.DEG2RAD, 
    0 * THREE.MathUtils.DEG2RAD, 
    0 * THREE.MathUtils.DEG2RAD
);
points.rotateOnWorldAxis(VECTOR3_UP, 0);
scene.add(points);

const originalVertexPositions = [];
{
    let vertex = new THREE.Vector3();
    for (let i = 0; i < vertices.count; i++) {
        vertex.fromBufferAttribute(vertices, i);
        points.localToWorld(vertex);
        originalVertexPositions.push(vertex.clone());
    }
}

console.log(originalVertexPositions[0].z);

const timer = new THREE.Timer();
const simplex = new SimplexNoise();

function animate(deltaTime) {
    const speed = 0.4;
    let movement = new THREE.Vector3(0, 0, -speed);
    movement.applyAxisAngle(VECTOR3_UP, cameraRotation.y);
    camera.position.add(movement);

    const threshold = terrainSize.y * 0.1;
    if (points.position.z - camera.position.z > threshold) {
        points.position.z -= threshold * 2;
    }

    timer.update();
    const time = timer.getElapsed();

    console.time("terrain");
    
    const positions = vertices.array;
    for (let i = 0; i < vertices.count; i++) {
        let vertex = originalVertexPositions[i];
        const height = getHeight(
            vertex.x + points.position.x, 
            vertex.z + points.position.z, 
            time
        );

        positions[i * 3 + 2] = height;
    }
    vertices.needsUpdate = true;

    console.timeEnd("terrain");

    const cameraY = 20;//getHeight(camera.position.x, camera.position.z, time) + 20;
    camera.position.setY(cameraY);

    renderer.render(scene, camera);
}

function getHeight(x, y, time) {
    const octaves = 8;
    const lacunarity = 2;
    const persistency = 0.4;
    
    let height = 0;
    let frequency = 0.02;
    let amplitude = 10;
    for (let i = 0; i < octaves; i++) {
        height += simplex.noise(
            x * frequency, 
            y * frequency
        ) * amplitude;
        
        frequency *= lacunarity;
        amplitude *= persistency;
    }

    return height;
}

renderer.setAnimationLoop(animate);

function resize() {
    const width = mainElement.clientWidth;
    const height = mainElement.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();