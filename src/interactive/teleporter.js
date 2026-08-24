export class Teleporter {
    constructor(input, positions, glider, vac) {
        this.input = input;
        this.positions = positions;
        this.glider = glider;
        this.vac = vac;
    }

    update() {
        const tpOffest = {x: 0, y: 0, z: -10};

        if (this.input.isKeyPressed("Digit1")) {
            this.teleportTo(this.positions[0], tpOffest);
        }
        else if (this.input.isKeyPressed("Digit2")) {
            this.teleportTo(this.positions[1], tpOffest);
        }
        else if (this.input.isKeyPressed("Digit3")) {
            this.teleportTo(this.positions[2], tpOffest);
        }
        else if (this.input.isKeyPressed("Digit4")) {
            this.teleportTo(this.positions[3], tpOffest);
        }
        else if (this.input.isKeyPressed("Digit5")) {
            this.teleportTo(this.positions[4], tpOffest);
        }
    }

    teleportTo(position, offset) {
        const p = {x: position.x + offset.x, y: 0, z: position.z + offset.z};
        p.y = this.getHeight(p.x, p.z);
        this.glider.setPosition(p);

        this.glider.lookAt({x: position.x, y: p.y, z: position.z});
    }

    getHeight(x, z) {
        return this.vac.getHeight(x, z) + 20;
    }
}