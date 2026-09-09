import * as utils from "#src/utils.js";

/**
 * Provides data for all projects I decided to include here.
 */
export class Projects {
	static async init() {
		const projectsFilePath = "src/projects.yaml";
		const data = await utils.loadYaml(projectsFilePath);

		this.map = new Map(Object.entries(data.projects));
	}

	static get(projectId) {
		return this.map.get(projectId);
	}

	static getAllIDs() {
		return [...this.map.keys()];
	}
}
