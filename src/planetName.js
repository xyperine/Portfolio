export class PlanetName {
    constructor(index, name, designation) {
        this.index = index;
        this.name = name;
        this.designation = designation;
    }

    toString() {
        return this.name;
    }
}
