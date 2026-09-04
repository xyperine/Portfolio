import * as THREE from "three";
import * as QUARKS from "three.quarks";
import { Interactable } from "#src/interactive/interactions/interactable.js";
import { Interactables } from "#src/interactive/interactions/interactables.js";
import { ProjectCard } from "#src/interactive/ui/projectCard.js";
import { ParticlesBurst } from "#src/interactive/particlesBurst.js";

/**
 * Handles beacon behavior.
 */
export class Beacon extends Interactable {
    /**
     * 
     * @param {THREE.Material} orbMaterial 
     * @param {THREE.Mesh} orbMesh 
     * @param {Object} projectData 
     * @param {THREE.PerspectiveCamera} camera 
     * @param {QUARKS.ParticleSystem} particles 
     * @param {ParticlesBurst} interactionParticlesBurst 
     */
    constructor(orbMaterial, orbMesh, projectData, camera, interactionParticlesBurst) {
        super();

        this.orbMesh = orbMesh;
        this.orbMaterial = orbMaterial;
        this.projectData = projectData;
        this.camera = camera;

        this.interactable = true;

        this.orbMesh.userData.interactable = this;
        Interactables.register(this.orbMesh);

        this.interactionParticlesBurst = interactionParticlesBurst;

        this.worldPosition = this.orbMesh.getWorldPosition(new THREE.Vector3());
    }
    
    update(gameState) {
        // Update material
        if (this.orbMaterial != undefined) {
            this.orbMaterial.uniforms.uCameraWorldPosition.value = gameState.camera.getWorldPosition(new THREE.Vector3());
            this.orbMaterial.uniforms.uTimeSeconds.value = gameState.elapsedTime * 0.001;
        }

        const distance = this.camera.getWorldPosition(new THREE.Vector3()).distanceTo(this.orbMesh.getWorldPosition(new THREE.Vector3()));
        const threshold = 80;
        if (distance < threshold) {
            const t = 1 - distance / threshold;
            this.camera.fov = THREE.MathUtils.lerp(75, 120, t*t);
            this.camera.updateProjectionMatrix();
        }
    }

    interact() {
        if (this.isInteractable()) {       
            console.log("Interacting!");

            this.interactionParticlesBurst.play(this.worldPosition);
            ProjectCard.show(this.projectData);            
        }
    }

    isInteractable() {
        return this.interactable;
    }

    dispose() {
        Interactables.unregister(this);
    }
}