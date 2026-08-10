import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { VertexShaderAlgorithmCopy } from '#src/vertexShaderAlgorithmCopy.js';
import { TerrainChunk } from '#src/terrainChunk.js';
import { getCssColorAsThreeColor } from '#src/utils.js';

export class Terrain {
    #vertexShader;
    #fragmentShader;

    constructor(scene, physicsWorld, vertexShader, fragmentShader, renderingDistance) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.#vertexShader = vertexShader;
        this.#fragmentShader = fragmentShader;
        
        this.shaderVertexAlgorithm = new VertexShaderAlgorithmCopy();
        this.chunkMap = new Map();
        const renderDistanceMultiplier = 1;
        this.chunkSize = {
            w: renderingDistance * renderDistanceMultiplier, 
            d: renderingDistance * renderDistanceMultiplier
        };
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
            
            vertexShader: this.#vertexShader,
            fragmentShader: this.#fragmentShader,
            fog: true
        });
        this.loadChunk(0, 0);
    }

    loadChunk(x, z) {
        const key = `${x},${z}`;
        if (!this.chunkMap.has(key)) {
            const chunkKey = this.getFarChunk(x, z);
            let chunk = this.chunkMap.get(chunkKey);
            if (chunk != null) {
                if (chunkKey !== key) { 
                    chunk.relocateTo(x * this.chunkSize.w, z * this.chunkSize.d);
                    this.applyDisplacement(chunk.physicsGeometry, chunk.renderObject.matrixWorld, chunk.physicsObject);
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
    
                if (Math.abs(x - cx) >= 5 || Math.abs(z - cz) >= 5) {
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

        const chunk = new TerrainChunk(points, body, physicsGeometry);
        return chunk;
    }

    applyDisplacement(geometry, ltwMatrix, rb) {
        let vertices = geometry.attributes.position;
        let vertex = new THREE.Vector3();
        let vertexWS = new THREE.Vector3();
        for (let i = 0; i < vertices.count; i++) {
            vertex.fromBufferAttribute(vertices, i);
            vertexWS.copy(vertex).applyMatrix4(ltwMatrix);
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

    update(playerPosition) {
        const rawX = playerPosition.x / this.chunkSize.w;
        const rawZ = playerPosition.z / this.chunkSize.d;
        const px = Math.round(rawX);
        const pz = Math.round(rawZ);
        for (let x = px - 2; x <= px + 2; x++) {
            for (let z = pz - 2; z <= pz + 2; z++) {
                this.loadChunk(x, z);
            }
        }
    }
    
    render(elapsedTime) {
        this.chunkMaterial.uniforms.time.value = elapsedTime;
    }
}