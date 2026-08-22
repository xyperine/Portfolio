import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Input } from '#src/interactive/input.js';
import { TemperatureMap } from '#src/interactive/worldGeneration/temperatureMap.js';
import { Interactor } from '#src/interactive/interactions/interactor.js';

/**
 * Player controller.
 */
export class Glider {
    /**
     * 
     * @param {THREE.Camera} camera 
     * @param {Input} input 
     * @param {THREE.Scene} scene 
     * @param {RAPIER.World} physicsWorld 
     * @param {TemperatureMap} temperatureMap
     */
    constructor(camera, input, scene, physicsWorld, temperatureMap) {
        this.VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
        this.VECTOR3_UP = new THREE.Vector3(0, 1, 0);
        this.VECTOR3_FORWARD = new THREE.Vector3(0, 0, -1);

        this.input = input;
        this.physicsWorld = physicsWorld;
        this.camera = camera;
        this.scene = scene;
        this.temperatureMap = temperatureMap;

        this.init();
    }

    init() {
        this.root = new THREE.Object3D();
        this.scene.add(this.root);
        this.root.position.set(0, 100, 0);
        
        this.cameraSocket = new THREE.Object3D();
        this.root.add(this.cameraSocket);
        this.cameraSocket.position.set(0, 0, 0);
        this.cameraSocket.rotation.set(0, 0, 0);
        
        this.cameraSocket.add(this.camera);
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        
        this.interactor = new Interactor(10, this.camera);

        this.findInitialAltitude();

        const rootPosition = this.root.getWorldPosition(new THREE.Vector3());
        const bodyDescription = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
            rootPosition.x,
            rootPosition.y,
            rootPosition.z
        );
        this.body = this.physicsWorld.createRigidBody(bodyDescription);
        const colliderDescription = RAPIER.ColliderDesc.ball(1);
        this.collider = this.physicsWorld.createCollider(colliderDescription, this.body);
        this.controller = this.physicsWorld.createCharacterController(0.01);
        
        this.smoothedMovement = new THREE.Vector3();
        this.smoothedPitchRotation = 0;
        this.smoothedYawRotation = 0;
        
        this.pitchLookRotation = 0;
        this.yawLookRotation = 0;
        
        this.aboveSolidSurface = false;
        this.altitude = 0;
        
        this.yVelocity = 0;

        this.shoot = () => {
            const origin = this.camera.getWorldPosition(new THREE.Vector3());
            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()));
            const ray = new RAPIER.Ray(
                {x: origin.x, y: origin.y, z: origin.z}, 
                {x: direction.x, y: direction.y, z: direction.z}
            );
            const maxToi = 999.0;
            let solid = true;
            let hit = this.physicsWorld.castRayAndGetNormal(ray, maxToi, solid);
            if (hit != null) {
                const point = ray.pointAt(hit.timeOfImpact);
                console.debug("Collider", hit.collider, "hit at point", point);

                if (hit.collider != null) {
                    const force = 10;
                    const impulseDirection = new RAPIER.Vector3(-hit.normal.x, -hit.normal.y, -hit.normal.z);
                    const impulse = new RAPIER.Vector3(
                        impulseDirection.x * force, 
                        impulseDirection.y * force, 
                        impulseDirection.z * force
                    );
                    hit.collider.parent().applyImpulse({
                        x: impulse.x, 
                        y: impulse.y, 
                        z: impulse.z
                    },
                    true
                );
                }
            }
        }
        this.mainElement = document.querySelector("main");
        this.mainElement.addEventListener("mousedown", this.shoot);
    }

    findInitialAltitude() {
        const worldPosition = this.root.getWorldPosition(new THREE.Vector3());
        
        const ray = new RAPIER.Ray(
            {x: worldPosition.x, y: worldPosition.y - 1.1, z: worldPosition.z},
            {x: 0, y: -1, z: 0}
        )
        const maxToi = 999.0;
        const solid = false;
        const hit = this.physicsWorld.castRay(ray, maxToi, solid);
        if (hit != null) {
            this.aboveSolidSurface = true;
            this.groundPoint = ray.pointAt(hit.timeOfImpact);

            const initialAltitude = 30;
            this.root.position.set(0, this.groundPoint.y + initialAltitude, 0);
        } else {
            this.aboveSolidSurface = false;
            this.groundPoint = null;

            this.root.position.set(0, 30, 0);
        }
    }

    processInputs() {
        this.calculateLookRotation();

        this.interactor.update();
        
        this.movementInput = new THREE.Vector3();
        if (this.input.isKeyDown("KeyW")) {
            this.movementInput.z += 1;
        }
        if (this.input.isKeyDown("KeyS")) {
            this.movementInput.z += -1;
        }
        if (this.input.isKeyDown("KeyD")) {
            this.movementInput.x += 1;
        }
        if (this.input.isKeyDown("KeyA")) {
            this.movementInput.x += -1;
        }
        
        this.movementInput.normalize();
        
        if (this.input.isKeyDown("Space")) {
            this.movementInput.y += 1;
        }
        if (this.input.isKeyDown("ShiftLeft")) {
            this.movementInput.y += -1;
        }

        if (this.input.isKeyPressed("KeyE")) {
            this.interactor.interact();
        }
    }

    calculateLookRotation() {
        const pitchSpeed = 0.003;
        const yawSpeed = 0.0015;

        const mouseDelta = this.input.getMouseDelta();

        this.pitchLookRotation += -mouseDelta.y * pitchSpeed;
        const pitchRange = {
            bottom: -Math.PI * 0.5,
            up: Math.PI * 0.5
        };
        this.pitchLookRotation = THREE.MathUtils.clamp(this.pitchLookRotation, pitchRange.bottom, pitchRange.up);
        const pitchRotationSmoothing = 0.1;
        this.smoothedPitchRotation = THREE.MathUtils.lerp(this.smoothedPitchRotation, this.pitchLookRotation, pitchRotationSmoothing);

        this.yawLookRotation += -mouseDelta.x * yawSpeed;        
        const yawRotationSmoothing = 0.2;
        this.smoothedYawRotation = THREE.MathUtils.lerp(this.smoothedYawRotation, this.yawLookRotation, yawRotationSmoothing);
    }

    processPhysics() {
        this.checkGround();

        // Calculate movement
        const speed = 0.5;

        const r = this.body.rotation();
        const rotation = new THREE.Quaternion(
            r.x,
            r.y,
            r.z,
            r.w
        );

        const forward = this.VECTOR3_FORWARD.clone();
        forward.applyQuaternion(rotation);
        forward.y = 0;
        forward.normalize();
        forward.multiplyScalar(this.movementInput.z);

        const right = this.VECTOR3_RIGHT.clone();
        right.applyQuaternion(rotation);
        right.y = 0;
        right.normalize();
        right.multiplyScalar(this.movementInput.x);

        const up = this.VECTOR3_UP.clone();
        up.multiplyScalar(this.movementInput.y);
        let movement = new THREE.Vector3()
            .add(forward)
            .add(right)
            .add(up)
            .normalize()
            .multiplyScalar(speed)
        ;
        
        this.smoothedMovement.lerp(movement, 0.04);
        movement = this.smoothedMovement;

        const currentTranslation = this.body.translation();
        // Hovering
        const groundSnapDistance = 10.0;
        if (this.aboveSolidSurface) {
            this.yVelocity += this.physicsWorld.gravity.y * this.physicsWorld.timestep;
            const desiredHeight = groundSnapDistance;
            const height = currentTranslation.y - this.groundPoint.y;
            const error = desiredHeight - height;
            if (error > 0) {
                const springStrength = 40;
                const correctionAcceleration = error * springStrength;
                const damping = 10;
                const dampingAcceleration = -this.yVelocity * damping;
                const acceleration = correctionAcceleration + dampingAcceleration;
                this.yVelocity += acceleration * this.physicsWorld.timestep;
            }

            movement.y = this.yVelocity * this.physicsWorld.timestep;

            this.altitude = this.body.translation().y - this.groundPoint.y;
        }

        this.controller.computeColliderMovement(this.collider, {
            x: movement.x,
            y: movement.y,
            z: movement.z
        });
        const actualMovement = {
            x: this.controller.computedMovement().x,
            y: this.controller.computedMovement().y,
            z: this.controller.computedMovement().z,
        };

        // Apply movement
        this.body.setNextKinematicTranslation({
            x: currentTranslation.x + actualMovement.x,
            y: currentTranslation.y + actualMovement.y,
            z: currentTranslation.z + actualMovement.z,
        })

        // Apply rotation
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.smoothedYawRotation, 0));
        this.body.setNextKinematicRotation({
            x: q.x,
            y: q.y,
            z: q.z,
            w: q.w
        });
    }

    checkGround() {
        const currentTranslation = this.body.translation();
        const ray = new RAPIER.Ray(
            {x: currentTranslation.x, y: currentTranslation.y - 1.1, z: currentTranslation.z},
            {x: 0, y: -1, z: 0}
        )
        const maxToi = 999.0;
        const solid = false;
        const hit = this.physicsWorld.castRayAndGetNormal(ray, maxToi, solid);
        if (hit != null) {
            this.aboveSolidSurface = true;
            this.groundPoint = ray.pointAt(hit.timeOfImpact);
            
        } else {
            this.aboveSolidSurface = false;
            this.groundPoint = null;
        }

    }

    sync() {
        let physicsPosition = this.body.translation();
        const physicsRotation = this.body.rotation();
        this.root.position.set(physicsPosition.x, physicsPosition.y, physicsPosition.z);
        this.root.quaternion.set(physicsRotation.x, physicsRotation.y, physicsRotation.z, physicsRotation.w);
    }

    render(elapsedTime) {
        this.cameraSocket.rotation.x = this.smoothedPitchRotation;
    }

    getRenderPosition() {
        let p = new THREE.Vector3();
        this.root.getWorldPosition(p);
        return p;
    }

    getTemperatureReading() {
        const p = this.getRenderPosition();
        return this.temperatureMap.temperatureAt(p.x, p.y, p.z);
    }

    dispose() {
        this.scene.remove(this.root);

        this.mainElement.removeEventListener("mousedown", this.shoot);
    }
}