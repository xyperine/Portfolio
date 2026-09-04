import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import * as utils from '#src/utils.js';
import { VertexShaderAlgorithmCopy } from '#src/interactive/worldGeneration/vertexShaderAlgorithmCopy.js';
import { Projects } from '#src/interactive/projects.js';
import { Shaders } from '#src/shaders.js';
import { Beacon } from '#src/interactive/beacon.js';

/**
 * Constructs the beacon site location.
 */
export class BeaconSite{
    /**
     * 
     * @param {number} x world space coordinate x
     * @param {number} z world space coordinate z
     * @param {THREE.Scene} scene 
     * @param {RAPIER.World} physicsWorld 
     * @param {VertexShaderAlgorithmCopy} vac 
     */
    constructor(x, z, scene, physicsWorld, vac, projectId) {
        this.x = x;
        this.z = z;
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.vac = vac;
        this.projectData = Projects.get(projectId);

        this.renderObjects = [];
        this.physicsObjects = [];

        this.siteSize = 40;
        this.siteObject = new THREE.Object3D();

        //this.createColumns();
        this.createPiedestal();
        this.createOrb();
    }

    createColumns() {
        for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
            const columnSize = {w: 4, h: 400, d: 4};
            const geometry = new THREE.BoxGeometry(
                columnSize.w, columnSize.h, columnSize.d, 
                columnSize.w * 1, columnSize.h * 1, columnSize.d * 1
            );
            const mat = new THREE.PointsMaterial({
                color: utils.getCssColorAsThreeColor("--column-color"),
                size: 0.2,
                sizeAttenuation: true,
                fog: true,
            });
            let xPos = this.x + Math.sin(Math.PI * columnIndex * 0.5) * this.siteSize;
            let zPos = this.z + Math.cos(Math.PI * columnIndex * 0.5) * this.siteSize;
            let yPos = this.vac.getHeight(xPos, zPos) + columnSize.h * 0.5 - 3;
            const points = new THREE.Points(geometry, mat);
            points.position.set(xPos, yPos, zPos);
            this.siteObject.add(points);

            const rbd = RAPIER.RigidBodyDesc.fixed().setTranslation(xPos, yPos, zPos);
            const rb = this.physicsWorld.createRigidBody(rbd);
            const cd = RAPIER.ColliderDesc.cuboid(columnSize.w * 0.5, columnSize.h * 0.5, columnSize.d * 0.5);
            const c = this.physicsWorld.createCollider(cd, rb);

            this.physicsObjects.push(rb);
        }
    }

    createPiedestal() {
        const verticalSize = 10;
        const horizontalSize = 4;
        const piedestalSize = {w: horizontalSize, h: verticalSize, d: horizontalSize};
        const geometry = new THREE.BoxGeometry(
            piedestalSize.w, piedestalSize.h, piedestalSize.d, 
            piedestalSize.w * 1, piedestalSize.h * 1, piedestalSize.d * 1
        );

        let vertices = geometry.attributes.position;
        let vertex = new THREE.Vector3();
        const halfVerticalSize = verticalSize * 0.5;
        const halfHorizontalSize = horizontalSize * 0.5;
        for (let i = 0; i < vertices.count; i++) {
            vertex.fromBufferAttribute(vertices, i);
            const height = vertex.y + halfVerticalSize;

            const heightFactor = height / verticalSize;
            const angle = Math.PI * 1/3 * heightFactor;
            
            const x = vertex.x * Math.cos(angle) - vertex.z * Math.sin(angle);
            const z = vertex.x * Math.sin(angle) + vertex.z * Math.cos(angle);
            const minY = calculateHeight(
                new THREE.Vector3(0, -halfVerticalSize, 0), 
                heightFactor
            );
            const maxY = calculateHeight(
                new THREE.Vector3(halfHorizontalSize, halfVerticalSize, halfHorizontalSize), 
                heightFactor
            );
            const y = THREE.MathUtils.mapLinear(
                calculateHeight(vertex, heightFactor), 
                minY, 
                maxY, 
                -halfVerticalSize, 
                halfVerticalSize
            );
            const p = new THREE.Vector3(
                x * (1 + heightFactor*heightFactor * 0.3 - 0.15), 
                y, 
                z * (1 + heightFactor*heightFactor * 0.3 - 0.15)
            );

            vertices.setXYZ(i, p.x, p.y, p.z);

            function calculateHeight(v, hf) {
                return v.y + 4 * hf * new THREE.Vector2(v.x, v.z).length();
            }
        }
        
        vertices.needsUpdate = true;

        const mat = new THREE.PointsMaterial({
            color: utils.getCssColorAsThreeColor("--column-color"),
            size: 0.2,
            sizeAttenuation: true,
            fog: true,
        });
        let xPos = this.x;
        let zPos = this.z;
        let yPos = this.vac.getHeight(xPos, zPos) + piedestalSize.h * 0.5 - 1;
        const points = new THREE.Points(geometry, mat);
        points.position.set(xPos, yPos, zPos);
        this.siteObject.add(points);

        const rbd = RAPIER.RigidBodyDesc.fixed().setTranslation(xPos, yPos, zPos);
        const rb = this.physicsWorld.createRigidBody(rbd);
        const cd = RAPIER.ColliderDesc.cuboid(piedestalSize.w * 0.5, piedestalSize.h * 0.5, piedestalSize.d * 0.5);
        const c = this.physicsWorld.createCollider(cd, rb);
        this.physicsObjects.push(rb);

        this.orbSocketY = yPos + piedestalSize.h - 1;
    }

    createOrb() {
        const vertShader = Shaders.beaconOrbVert;
        const fragShader = Shaders.beaconOrbFrag;

        const orbRadius = 4;
        const sg = new THREE.SphereGeometry(orbRadius, orbRadius * 4, orbRadius * 4);
        const shapeID = this.projectData.interactive.number - 1;
        this.sm = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog, 
                {
                    uTimeSeconds: {value: 0},
                    uCameraWorldPosition: {value: new THREE.Vector3()},
                    uPrimaryColor: {value: new THREE.Color(this.projectData.interactive.color)},
                    uProjectNumber: {value: shapeID}
                }
            ]),
            vertexShader: vertShader,
            fragmentShader: fragShader,
            fog: true,
            transparent: true,
            side: THREE.DoubleSide,
        });

        let syPos = this.orbSocketY + orbRadius * 0.5;
        let sxPos = this.x;
        let szPos = this.z;
        const sp = new THREE.Mesh(sg, this.sm);
        sp.position.set(sxPos, syPos, szPos);
        this.siteObject.add(sp);
        this.sp = sp;

        const srbd = RAPIER.RigidBodyDesc.fixed().setTranslation(sxPos, syPos, szPos);
        const srb = this.physicsWorld.createRigidBody(srbd);
        const scd = RAPIER.ColliderDesc.ball(orbRadius * 0.5);
        const sc = this.physicsWorld.createCollider(scd, srb);

        this.physicsObjects.push(srb);

        this.scene.add(this.siteObject);
        this.renderObjects.push(this.siteObject);

        this.worldPosition = sp.getWorldPosition(new THREE.Vector3());
    }

    update(gameState) {
        this.beacon.update(gameState);
    }

    dispose() {
        this.beacon.dispose();

        for(let ro of this.renderObjects) {
            ro.traverse(o => {
                if (o.geometry) {
                    o.geometry.dispose();
                }
                if (o.material) {
                    if (Array.isArray(o.material)) {
                        o.material.forEach(material => {
                            material.dispose();
                        });
                    } else {
                        o.material.dispose();
                    }
                }
            })

            this.scene.remove(ro);
        }
        for(let po of this.physicsObjects) {
            this.physicsWorld.removeRigidBody(po);
        }
    }
}