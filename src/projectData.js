
export class ProjectData {
    constructor(name, description, link, color, number) {
        this.name = name;
        this.description = description;
        this.link = link;
        this.interactive = {color, number};
    }
}
