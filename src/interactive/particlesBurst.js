import * as THREE from "three";
import * as QUARKS from "three.quarks";

/**
 * One-shot particles player.
 */
export class ParticlesBurst {
    /**
     * 
     * @param {THREE.Scene} scene 
     * @param {QUARKS.BatchedRenderer} particlesRenderer 
     * @param {QUARKS.ParticleSystem} particles 
     */
    constructor(scene, particlesRenderer, particles) {
        this.scene = scene;
        this.particlesRenderer = particlesRenderer;
        this.particles = particles;
    }

    play(position, particles = this.particles) {
        const burstInstance = particles.clone();
        this.scene.add(burstInstance.emitter);
        burstInstance.emitter.position.copy(position);
        this.particlesRenderer.addSystem(burstInstance);
    }
}