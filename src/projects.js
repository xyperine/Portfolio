import { ProjectData } from '#src/projectData.js';

// TODO: Fix duplicate compass pointers
export class Projects {
    static init() {
        // Read file and create project data

        this.map = new Map();
        const projects = [
            new ProjectData("Conifer Init", "Unity tool for project setup automation", "balbaaaaa", "hsl(105, 80%, 50%)", 1),
            new ProjectData("Icons Creator", "Unity tool for creating icons of 3D objects in the editor.", "balbaaaaa", "hsl(180, 80%, 50%)", 2),
            new ProjectData("Reality Grid", "Incremental game blalaaaa", "balbaaaaa", "hsl(30, 80%, 50%)", 3),
            new ProjectData("Dots Killer", "Some other game", "balbaaaaa", "hsl(330, 80%, 50%)", 4),
            new ProjectData("Genesis Constructa", "Mobile idle arcade game set on a distant planet", "balbaaaaa", "hsl(255, 80%, 50%)", 5),
        ];
        this.map.set("1", projects[0]);
        this.map.set("2", projects[1]);
        this.map.set("3", projects[2]);
        this.map.set("4", projects[3]);
        this.map.set("5", projects[4]);

        console.log(this.map)
    }

    static get(projectId) {
        return this.map.get(projectId);
    }

    static getAllIDs() {
        return [...this.map.keys()];
    }
}