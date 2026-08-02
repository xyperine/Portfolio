import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Input } from '#src/input.js';
import { World } from '#src/world.js';
import { VertexShaderAlgorithmCopy } from '#src/shaderVertexDisplacementCopy.js';

export class InteractiveWorld extends World {
    constructor() {
        super();
    }

    init() {
        this.input = new Input();
        this.shaderVertexAlgorithm = new VertexShaderAlgorithmCopy();
        this.terrainSize = new THREE.Vector2(600, 400);
        this.physicsDebug = false;
        if (this.physicsDebug) {
            this.terrainSize.set(10, 10);
        }
        
        // Scene
        const backgroundColor = this.getCssColor("--background-color");
        this.scene = new THREE.Scene();
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        // Camera
        this.glider = new THREE.Object3D();
        this.scene.add(this.glider);
        this.glider.position.set(0, 30, 6);
        this.cameraSocket = new THREE.Object3D();
        this.glider.add(this.cameraSocket);
        this.cameraSocket.position.set(0, 0, 0);
        this.cameraSocket.rotation.set(0, 0, 0);
        const cameraRotation = new THREE.Vector3(
            -15 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraSocket.add(this.camera);
        this.camera.rotateOnWorldAxis(this.VECTOR3_RIGHT, cameraRotation.x);
        this.camera.rotateOnWorldAxis(this.VECTOR3_UP, cameraRotation.y);
        this.camera.rotateOnWorldAxis(this.VECTOR3_FORWARD, cameraRotation.z);
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector("#terrain"),
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(elapsedTime => {
            this.update(elapsedTime);
        });
        
        // Terrain
        const terrainGeometry = new THREE.PlaneGeometry(
            this.terrainSize.x, 
            this.terrainSize.y, 
            this.terrainSize.x, 
            this.terrainSize.y
        );
        
        // Points
        this.pointsMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
                {
                    time: {value: 0},
                    pointSize: {value: 0.2},
                    terrainColor: {value: this.getCssColor("--terrain-color")}
                }
            ]),
            
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("fragmentShader").textContent,
            fog: true
        });
        this.points = new THREE.Points(terrainGeometry, this.pointsMaterial);
        this.points.rotation.set(
            -90 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD, 
            0 * THREE.MathUtils.DEG2RAD
        );
        this.scene.add(this.points);
        
        this.mainElement = document.querySelector("main");
        this.onWindowResized = () => {
            this.resize(this.mainElement.clientWidth, this.mainElement.clientHeight);
        };
        window.addEventListener("resize", this.onWindowResized);
        this.resize(this.mainElement.clientWidth, this.mainElement.clientHeight);
        
        this.onMouseClickCanvas = () => {
            this.renderer.domElement.requestPointerLock();
        };
        this.mainElement.addEventListener("click", this.onMouseClickCanvas);
        this.renderer.domElement.requestPointerLock();

        this.lookRotation = new THREE.Vector3();
        this.onMouseMoved = event => {
            if (document.pointerLockElement != null) {
                this.lookRotation.x += -event.movementY * 0.002;
                this.lookRotation.y += -event.movementX * 0.002;
                this.lookRotation.z = 0;
            
                this.lookRotation.x = THREE.MathUtils.clamp(this.lookRotation.x, -Math.PI * 0.5, Math.PI * 0.5);
                this.lookRotation.y = THREE.MathUtils.euclideanModulo(this.lookRotation.y + Math.PI, Math.PI * 2) - Math.PI; 
            }
        }
        document.addEventListener("mousemove", this.onMouseMoved);

        // Setup physics
        this.physicsWorld = new RAPIER.World({
            x: 0,
            y: -9.81,
            z: 0
        });

        let q = this.points.getWorldQuaternion(new THREE.Quaternion());
        const terrainBodyDescription = RAPIER.RigidBodyDesc.fixed().setRotation({x: q.x, y: q.y, z: q.z, w: q.w});
        this.terrainBody = this.physicsWorld.createRigidBody(terrainBodyDescription);
        const terrainPhysicsMeshResolution = 0.1;
        this.simplifiedTerrainGeometry = new THREE.PlaneGeometry(
            this.terrainSize.x, 
            this.terrainSize.y,
            Math.round(this.terrainSize.x * terrainPhysicsMeshResolution),
            Math.round(this.terrainSize.y * terrainPhysicsMeshResolution)
        );
        this.applyDisplacement();
        const terrainColliderDescription = RAPIER.ColliderDesc.trimesh(this.simplifiedTerrainGeometry.attributes.position.array, this.simplifiedTerrainGeometry.index.array);
        const terrainCollider = this.physicsWorld.createCollider(terrainColliderDescription, this.terrainBody);

        const gliderPosition = this.glider.getWorldPosition(new THREE.Vector3());
        const gliderBodyDescription = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
            gliderPosition.x,
            gliderPosition.y,
            gliderPosition.z
        );
        this.gliderBody = this.physicsWorld.createRigidBody(gliderBodyDescription);
        this.gliderBody.setEnabledRotations(false, true, false, true);
        const gliderColliderDescription = RAPIER.ColliderDesc.ball(1);
        this.gliderCollider = this.physicsWorld.createCollider(gliderColliderDescription, this.gliderBody);
        this.gliderController = this.physicsWorld.createCharacterController(0.01);


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
        this.mainElement.addEventListener("mousedown", this.shoot);
        
        if (this.physicsDebug) {
            this.debugPhysics();
        }
    }

    applyDisplacement() {
        let vertices = this.simplifiedTerrainGeometry.attributes.position;
        let vertex = new THREE.Vector3();
        for (let i = 0; i < vertices.count; i++) {
            vertex.fromBufferAttribute(vertices, i);
            let vertexWS = this.points.localToWorld(vertex.clone());
            let height = this.shaderVertexAlgorithm.getHeight(vertexWS.x, vertexWS.z);

            vertices.setZ(i, height);
        }

        vertices.needsUpdate = true;
    }

    debugPhysics() {
        let q = this.points.getWorldQuaternion(new THREE.Quaternion());
        const terrainColliderDesc = RAPIER.ColliderDesc.trimesh(this.simplifiedTerrainGeometry.attributes.position.array, this.simplifiedTerrainGeometry.index.array);
        const terrainCollider = this.physicsWorld.createCollider(terrainColliderDesc, this.terrainBody);

        let {vertices, colors} = this.physicsWorld.debugRender();

        console.log(vertices.length);
        console.log(vertices.slice(0, 20));
        console.log(colors.length);

        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        g.setAttribute("color", new THREE.BufferAttribute(colors, 4));

        const m = new THREE.LineBasicMaterial({
            vertexColors: true
        })

        const mesh = new THREE.LineSegments(g, m);
        this.scene.add(mesh);
    }
    
    update(elapsedTime) {
        this.processInputs();

        this.processPhysics();

        this.render(elapsedTime);
    }

    processInputs() {
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

    processPhysics() {
        // Move the glider
        const speed = 0.5;
        
        const r = this.gliderBody.rotation();
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
        const movement = new THREE.Vector3()
            .add(forward)
            .add(right)
            .add(up)
            .normalize()
            .multiplyScalar(speed);
        
        this.gliderController.computeColliderMovement(this.gliderCollider, {
            x: movement.x,
            y: movement.y,
            z: movement.z
        });
        const actualMovement = {
            x: this.gliderController.computedMovement().x,
            y: this.gliderController.computedMovement().y,
            z: this.gliderController.computedMovement().z,
        };
        const currentTranslation = this.gliderBody.translation();
        this.gliderBody.setNextKinematicTranslation({
            x: currentTranslation.x + actualMovement.x,
            y: currentTranslation.y + actualMovement.y,
            z: currentTranslation.z + actualMovement.z,
        })

        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.lookRotation.y, 0));
        this.gliderBody.setNextKinematicRotation({
            x: q.x,
            y: q.y,
            z: q.z,
            w: q.w
        });

        this.physicsWorld.step();

        this.syncPhysicsAndRendering();
        
        if (this.physicsDebug) {
            if (this.input.isKeyDown("KeyQ")) {
                this.debugPhysics();
            }
        }
    }
    
    syncPhysicsAndRendering() {
        let pGlider = this.gliderBody.translation();
        const rGlider = this.gliderBody.rotation();
        this.glider.position.set(pGlider.x, pGlider.y, pGlider.z);
        this.glider.quaternion.set(rGlider.x, rGlider.y, rGlider.z, rGlider.w);
    }

    render(elapsedTime) {
        // Move the camera
        this.cameraSocket.rotation.x = this.lookRotation.x;

        // Move terrain to make it look infinite
        const threshold = this.terrainSize.y * 0.1;
        if (this.points.position.z - this.glider.position.z > threshold) {
            this.points.position.z -= threshold * 2;
            this.applyDisplacement();
        }
        
        // Update the shader
        this.pointsMaterial.uniforms.time.value = elapsedTime;
        
        this.renderer.render(this.scene, this.camera);
    }

    updateColors() {
        const backgroundColor = this.getCssColor("--background-color");
        this.scene.background = backgroundColor;
        const fog = new THREE.Fog(backgroundColor, 30, 180);
        this.scene.fog = fog;
        
        this.pointsMaterial.uniforms.terrainColor.value.set(this.getCssColor("--terrain-color"));
    }

    dispose() {
        this.scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        material.dispose();
                    });
                } else {
                    object.material.dispose();
                }
            }
        });

        this.renderer.dispose();
        this.input.dispose();

        this.mainElement.removeEventListener("click", this.onMouseClickCanvas);
        window.removeEventListener("resize", this.onWindowResized);
        document.removeEventListener("mousemove", this.onMouseMoved);
    }
}