import * as yaml from "yaml";
import * as theme from "#src/theme.js";

// Get project id
const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

// Get project data
const response = await fetch("src/projects.yaml");
const text = await response.text();
const projects = yaml.parse(text).projects;

const project = projects[projectId];
if (!project) {
	document.body.textContent = "Project not found.";
	throw new Error(`Unknown project: ${projectId}`);
}

// Apply project data
document.title = `${project.name} | Arthur Mordvinov`;

document.body.style.setProperty("--color", project.interactive.color);

document.querySelector(".content .title").textContent = project.name;
document.querySelector(".content .tagged-title .meta-tag").textContent =
	project.metaTag;
document.querySelector(".short-description").textContent = project.description;
document.querySelector(".description p").textContent = project.page.description;
document.querySelector(".technology p").textContent = project.page.technology;
document.querySelector(".features p").textContent = project.page.features;
document
	.querySelector(".content a")
	.setAttribute("href", project.page.storeLink);

// Dark mode
theme.initializeDarkMode();
const darkModeSwitch = document.querySelector("#dark-mode-switch");
darkModeSwitch.addEventListener("click", (event) => {
	theme.toggleDarkMode();
	darkModeSwitch.textContent = theme.getDarkMode() ? "DARK" : "LIGHT";
});
