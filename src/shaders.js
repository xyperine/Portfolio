import * as utils from "#src/utils.js";
import * as THREE from "three";

export class Shaders {
	static async init() {
		THREE.ShaderChunk["formulas"] = await utils.loadAsText(
			"shaders/formulas.glsl",
		);

		this.beaconOrbVert = await utils.loadAsText(
			"shaders/beacon_orb.vert.glsl",
		);
		this.beaconOrbFrag = await utils.loadAsText(
			"shaders/beacon_orb.frag.glsl",
		);

		this.terrainVert = await utils.loadAsText("shaders/terrain.vert.glsl");
		this.terrainFrag = await utils.loadAsText("shaders/terrain.frag.glsl");
	}
}
