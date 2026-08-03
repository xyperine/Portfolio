import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class Glider {
    /**
     * 
     * @param {THREE.Camera} camera 
     * @param {Input} input 
     * @param {THREE.Scene} scene 
     * @param {RAPIER.World} physicsWorld 
     */
    constructor(camera, input, scene, physicsWorld) {
        this.VECTOR3_RIGHT = new THREE.Vector3(1, 0, 0);
        this.VECTOR3_UP = new THREE.Vector3(0, 1, 0);
        this.VECTOR3_FORWARD = new THREE.Vector3(0, 0, -1);

        this.input = input;
        this.physicsWorld = physicsWorld;
        this.camera = camera;
        this.scene = scene;

        this.init();
    }

    init() {
        this.root = new THREE.Object3D();
        this.scene.add(this.root);
        this.root.position.set(0, 30, 6);

        this.cameraSocket = new THREE.Object3D();
        this.root.add(this.cameraSocket);
        this.cameraSocket.position.set(0, 0, 0);
        this.cameraSocket.rotation.set(0, 0, 0);

        const cameraRotation = new THREE.Vector3(
            -15 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.cameraSocket.add(this.camera);
        this.camera.rotateOnWorldAxis(this.VECTOR3_RIGHT, cameraRotation.x);
        this.camera.rotateOnWorldAxis(this.VECTOR3_UP, cameraRotation.y);
        this.camera.rotateOnWorldAxis(this.VECTOR3_FORWARD, cameraRotation.z);
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);

        const gliderPosition = this.root.getWorldPosition(new THREE.Vector3());
        const gliderBodyDescription = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
            gliderPosition.x,
            gliderPosition.y,
            gliderPosition.z
        );
        this.body = this.physicsWorld.createRigidBody(gliderBodyDescription);
        const gliderColliderDescription = RAPIER.ColliderDesc.ball(1);
        this.gliderCollider = this.physicsWorld.createCollider(gliderColliderDescription, this.body);
        this.controller = this.physicsWorld.createCharacterController(0.01);

        this.smoothedMovement = new THREE.Vector3();
        this.smoothedPitchRotation = 0;
        this.smoothedYawRotation = 0;

        this.pitchLookRotation = 0;
        this.yawLookRotation = 0;

        this.grounded = false;

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

    processInputs() {
        this.calculateLookRotation();
        
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
    }

    calculateLookRotation() {
        const horizontalMouseSensitivity = 0.001;
        const verticalMouseSensitivity = 0.001;

        this.pitchLookRotation = -this.input.getMouseDelta().y * verticalMouseSensitivity;
        const pitchRotationSmoothing = 0.1;
        this.smoothedPitchRotation = THREE.MathUtils.lerp(this.smoothedPitchRotation, this.pitchLookRotation, pitchRotationSmoothing);
        this.pitchLookRotation = this.smoothedPitchRotation;
        this.pitchLookRotation = THREE.MathUtils.clamp(this.pitchLookRotation, -Math.PI * 0.5, Math.PI * 0.5);

        this.yawLookRotation = -this.input.getMouseDelta().x * horizontalMouseSensitivity;    
        const yawRotationSmoothing = 0.15;
        this.smoothedYawRotation = THREE.MathUtils.lerp(this.smoothedYawRotation, this.yawLookRotation, yawRotationSmoothing);
        this.yawLookRotation = this.smoothedYawRotation;
        this.yawLookRotation = THREE.MathUtils.euclideanModulo(this.yawLookRotation + Math.PI, Math.PI * 2) - Math.PI;
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
            .multiplyScalar(speed);
        
        this.smoothedMovement.lerp(movement, 0.04);
        movement = this.smoothedMovement;
        
        this.controller.computeColliderMovement(this.gliderCollider, {
            x: movement.x,
            y: movement.y,
            z: movement.z
        });
        const actualMovement = {
            x: this.controller.computedMovement().x,
            y: this.controller.computedMovement().y,
            z: this.controller.computedMovement().z,
        };
        
        const currentTranslation = this.body.translation();

        // Ground snapping
        const groundSnapDistance = 10.0;
        if (this.grounded) {
            currentTranslation.y = this.groundPoint.y + groundSnapDistance;
        }

        // Apply movement
        this.body.setNextKinematicTranslation({
            x: currentTranslation.x + actualMovement.x,
            y: currentTranslation.y + actualMovement.y,
            z: currentTranslation.z + actualMovement.z,
        })

        // Apply rotation
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yawLookRotation, 0));
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
            {x: currentTranslation.x, y: currentTranslation.y - 2, z: currentTranslation.z},
            {x: 0, y: -1, z: 0}
        )
        const maxToi = 999.0;
        const solid = false;
        const hit = this.physicsWorld.castRayAndGetNormal(ray, maxToi, solid);
        if (hit != null) {
            this.grounded = true;
            this.groundPoint = ray.pointAt(hit.timeOfImpact);
            
        } else {
            this.grounded = false;
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
        this.cameraSocket.rotation.x = this.pitchLookRotation;
    }

    dispose() {
        this.mainElement.removeEventListener("mousedown", this.shoot);
    }
}