import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class TerrainChunk {
    /**
     *
     * @param {THREE.Points} renderObject
     * @param {RAPIER.RigidBody} physicsObject
     */
    constructor(renderObject, physicsObject) {
        this.renderObject = renderObject;
        this.physicsObject = physicsObject;
    }

    isAvailable() {
    }

    getXZPosition() {
        let p = new THREE.Vector3();
        this.renderObject.getWorldPosition(p);
        p.y = 0;
        return p;
    }

    relocateTo(x, z) {
        this.physicsObject.setTranslation({ x, y: this.physicsObject.translation().y, z });
        const p = this.physicsObject.translation();
        this.renderObject.position.set(p.x, p.y, p.z);
        this.renderObject.updateMatrixWorld(true);
    }
}
