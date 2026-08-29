import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import * as utils from '#src/utils.js';
import { VertexShaderAlgorithmCopy } from '#src/interactive/worldGeneration/vertexShaderAlgorithmCopy.js';
import { Projects } from '#src/interactive/projects.js';
import { Interactable } from '#src/interactive/interactions/interactable.js';
import { Interactables } from '#src/interactive/interactions/interactables.js';
import { Shaders } from '#src/shaders.js';
import { ProjectCard } from '#src/interactive/ui/projectCard.js';

export class BeaconSite extends Interactable{
    /**
     * 
     * @param {number} x world space coordinate x
     * @param {number} z world space coordinate z
     * @param {THREE.Scene} scene 
     * @param {RAPIER.World} physicsWorld 
     * @param {VertexShaderAlgorithmCopy} vac 
     */
    constructor(x, z, scene, physicsWorld, vac, projectId) {
        super();

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

        this.interactable = true;

        this.createColumns();
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
        const piedestalSize = {w: 4, h: 10, d: 4};
        const geometry = new THREE.BoxGeometry(
            piedestalSize.w, piedestalSize.h, piedestalSize.d, 
            piedestalSize.w * 1, piedestalSize.h * 1, piedestalSize.d * 1
        );
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

    async createOrb() {
        const vertShader = Shaders.beaconOrbVert;
        const fragShader = Shaders.beaconOrbFrag;

        const orbRadius = 4;
        const sg = new THREE.SphereGeometry(orbRadius, orbRadius * 4, orbRadius * 4);
        const shapeID = this.projectData.interactive.number - 1;
        this.sm = new THREE.ShaderMaterial({
            //color: 0x000000,//utils.getCssColorAsThreeColor("--column-color"),
            //fog: true,
            uniforms: {
                uTimeSeconds: {value: 0},
                uCameraWorldPosition: {value: new THREE.Vector3()},
                uPrimaryColor: {value: new THREE.Color(this.projectData.interactive.color)},
                uProjectNumber: {value: shapeID}
            },
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
            side: THREE.DoubleSide,
        });

        let syPos = this.orbSocketY + orbRadius * 0.5;
        let sxPos = this.x;
        let szPos = this.z;
        const sp = new THREE.Mesh(sg, this.sm);
        sp.userData.interactable = this;
        Interactables.register(sp);
        sp.position.set(sxPos, syPos, szPos);
        this.siteObject.add(sp);

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
        if (this.sm != undefined) {
            this.sm.uniforms.uCameraWorldPosition.value = gameState.camera.getWorldPosition(new THREE.Vector3());
            this.sm.uniforms.uTimeSeconds.value = gameState.elapsedTime * 0.001;
        }
    }

    interact() {
        if (this.isInteractable()) {       
            console.log("Interacting!");

            ProjectCard.show(this.projectData);            
        }
    }

    isInteractable() {
        return this.interactable;
    }

    dispose() {
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