import * as THREE from 'three';
import * as QUARKS from 'three.quarks';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { BeaconSite } from '#src/interactive/beaconSite.js';
import { Beacon } from '#src/interactive/beacon.js';
import { VertexShaderAlgorithmCopy } from '#src/interactive/worldGeneration/vertexShaderAlgorithmCopy.js';
import { ParticlesBurst as ParticlesBurst } from '#src/interactive/particlesBurst.js';

export class BeaconFactory {
    particleSystems = new Map();
    interactParticleSystems = new Map();
    interactTrailParticleSystems = new Map();

    /**
     * 
     * @param {THREE.Scene} scene 
     * @param {RAPIER.World} physicsWorld 
     * @param {VertexShaderAlgorithmCopy} vac 
     * @param {THREE.PerspectiveCamera} camera 
     * @param {QUARKS.BatchedRenderer} particlesRenderer 
     */
    constructor(scene, physicsWorld, vac, camera, particlesRenderer) {
        this.scene = scene;
        this.physicsWorld = physicsWorld,
        this.vac = vac,
        this.camera = camera;
        this.particlesRenderer = particlesRenderer;
    }

    create(x, z, projectId) {
        const beaconSite = new BeaconSite(
            x, 
            z, 
            this.scene, 
            this.physicsWorld, 
            this.vac, 
            projectId
        );
        const ambientParticles = this.createAmbientParticles(beaconSite.projectData);
        ambientParticles.emitter.position.copy(beaconSite.worldPosition);
        const interactionParticles = this.createInteractParticles(beaconSite.projectData);
        interactionParticles.emitter.position.copy(beaconSite.worldPosition);
        const particlesBurst = new ParticlesBurst(this.scene, this.particlesRenderer, interactionParticles);
        const beacon = new Beacon(beaconSite.sm, beaconSite.sp, beaconSite.projectData, this.camera, particlesBurst);
        beaconSite.beacon = beacon;

        return beaconSite;
    }

    createAmbientParticles(projectData) {
        if (this.particleSystems.has(projectData.interactive.number)) {
            return this.particleSystems.get(projectData.interactive.number);
        }

        const color = new THREE.Color(projectData.interactive.color).offsetHSL(0, 0, 0.2);
        const ps = new QUARKS.ParticleSystem({
            duration: 10,
            looping: true,
            worldSpace: true,
            prewarm: false,

            startLife: new QUARKS.IntervalValue(3, 6),
            startSpeed: new QUARKS.ConstantValue(0),
            startSize: new QUARKS.IntervalValue(0.08, 0.2),
            startRotation: new QUARKS.RandomQuatGenerator(),
            startColor: new QUARKS.ConstantColor(new THREE.Vector4(color.r, color.g, color.b, 1)),

            emissionOverTime: new QUARKS.IntervalValue(100, 200),
            shape: new QUARKS.SphereEmitter({
                radius: 40,
                thickness: 0.9
            }),

            material: new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                fog: true
            }),
            renderMode: QUARKS.RenderMode.Mesh,

            behaviors: [
                new QUARKS.TurbulenceField(
                    new THREE.Vector3(10, 10, 10), 
                    3, 
                    new THREE.Vector3(0.5, 0.5, 0.5), 
                    new THREE.Vector3(0.1, 0.1, 0.1)
                ),
                new QUARKS.Noise(
                    new QUARKS.ConstantValue(0.4),
                    new QUARKS.ConstantValue(0.1),
                    new QUARKS.ConstantValue(0),
                    new QUARKS.ConstantValue(0.2)
                ),

                new QUARKS.SizeOverLife(
                    new QUARKS.PiecewiseBezier([[new QUARKS.Bezier(0, 1, 1, 0), 0]])
                )
            ]
        });

        this.particleSystems.set(projectData.interactive.number, ps);
        this.scene.add(ps.emitter);
        this.particlesRenderer.addSystem(ps);

        return ps;
    }

    createInteractParticles(projectData) {
        if (this.interactParticleSystems.has(projectData.interactive.number)) {
            return this.interactParticleSystems.get(projectData.interactive.number);
        }

        const color = new THREE.Color(projectData.interactive.color).offsetHSL(0, 0, 0.2);
        const ps = new QUARKS.ParticleSystem({
            duration: 5,
            looping: false,
            worldSpace: true,
            prewarm: false,
            autoDestroy: true,
            
            startLife: new QUARKS.IntervalValue(2, 4),
            startSpeed: new QUARKS.ConstantValue(10),
            startSize: new QUARKS.IntervalValue(0.1, 0.2),
            startRotation: new QUARKS.RandomQuatGenerator(),
            startColor: new QUARKS.ConstantColor(new THREE.Vector4(color.r, color.g, color.b, 1)),
            
            emissionOverTime: new QUARKS.ConstantValue(0),
            emissionBursts: [
                {
                    time: 0,
                    count: new QUARKS.IntervalValue(100, 150),
                    cycle: 1,
                    interval: 0,
                    probability: 1
                }
            ],
            shape: new QUARKS.SphereEmitter({
                radius: 3,
                thickness: 0
            }),

            material: new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                fog: true
            }),
            renderMode: QUARKS.RenderMode.Mesh,
            
            behaviors: [
                new QUARKS.TurbulenceField(
                    new THREE.Vector3(5, 5, 5), 
                    1, 
                    new THREE.Vector3(100, 100, 100), 
                    new THREE.Vector3(0.2, 0.2, 0.2)
                ),
                new QUARKS.SizeOverLife(
                    new QUARKS.PiecewiseBezier([[new QUARKS.Bezier(1, 1, 1, 0), 0]])
                ),
                new QUARKS.SpeedOverLife(
                    new QUARKS.PiecewiseBezier([[new QUARKS.Bezier(1.0, 0.5, 0.25, 0), 0]])
                )
            ]
        });
        
        let trailPs;
        if (this.interactTrailParticleSystems.has(projectData.interactive.number)) {
            trailPs = this.interactTrailParticleSystems.get(projectData.interactive.number);
        } else {
            trailPs = new QUARKS.ParticleSystem({
                duration: 0.1,
                looping: false,
                worldSpace: true,
                prewarm: false,
                autoDestroy: true,
    
                startLife: new QUARKS.IntervalValue(0.5, 0.8),
                startSpeed: new QUARKS.IntervalValue(1, 3),
                startSize: new QUARKS.IntervalValue(0.05, 0.15),
                startColor: new QUARKS.ConstantColor(new THREE.Vector4(color.r, color.g, color.b, 1)),
    
                emissionOverTime: new QUARKS.ConstantValue(1),
                shape: new QUARKS.PointEmitter(),
    
                renderMode: QUARKS.RenderMode.Mesh,
                material: new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    fog: true
                }),
                behaviors: [
                    new QUARKS.SizeOverLife(
                        new QUARKS.PiecewiseBezier([[new QUARKS.Bezier(1, 0.5, 0.25, 0), 0]])
                    ),
                    new QUARKS.SpeedOverLife(
                        new QUARKS.PiecewiseBezier([[new QUARKS.Bezier(1.0, 0.5, 0.25, 0), 0]])
                    ),
                ]
            });

            this.scene.add(trailPs.emitter)
            this.particlesRenderer.addSystem(trailPs);

            this.interactTrailParticleSystems.set(projectData.interactive.number, trailPs);
        }
        ps.addBehavior(
            new QUARKS.EmitSubParticleSystem(
                ps,
                true,
                trailPs.emitter,
                QUARKS.SubParticleEmitMode.Frame,
                0.5
            )
        );

        ps.stop();
        this.interactParticleSystems.set(projectData.interactive.number, ps);

        return ps;
    }

    dispose() {
        for (const ps of [...this.particleSystems.values()]) {
            this.particlesRenderer.deleteSystem(ps);
            ps.dispose();
        }
        this.particleSystems.clear();

        for (const ps of [...this.interactParticleSystems.values()]) {
            this.particlesRenderer.deleteSystem(ps);
            ps.dispose();
        }
        this.interactParticleSystems.clear();

        for (const ps of [...this.interactTrailParticleSystems.values()]) {
            this.particlesRenderer.deleteSystem(ps);
            ps.dispose();
        }
        this.interactTrailParticleSystems.clear();
    }
}