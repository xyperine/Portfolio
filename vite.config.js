import { fileURLToPath, URL } from "node:url";

/** @type {import('vite').UserConfig} */
export default {
	base: "/Portfolio/",
	resolve: {
		alias: {
			"#src": fileURLToPath(new URL("./src", import.meta.url)),
			rapier: "@dimforge/rapier3d-compat",
		},
	},
	input: ["index.html", "project-page.html"],
};
