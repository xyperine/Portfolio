import * as utils from "#src/utils.js";
import * as THREE from "three";

export class Shaders {
	static async init() {
		THREE.ShaderChunk["formulas"] = await utils.loadAsText(
			"src/shaders/formulas.glsl",
		);

		this.beaconOrbVert = await utils.loadAsText(
			"src/shaders/beacon_orb.vert.glsl",
		);
		this.beaconOrbFrag = await utils.loadAsText(
			"src/shaders/beacon_orb.frag.glsl",
		);

		this.terrainVert = await utils.loadAsText(
			"src/shaders/terrain.vert.glsl",
		);
		this.terrainFrag = await utils.loadAsText(
			"src/shaders/terrain.frag.glsl",
		);
	}
}
