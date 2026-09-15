import * as yaml from "yaml";

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

console.log(project)

// Apply project data
document.title = `${project.name} | Arthur Mordvinov`;

document.body.style.setProperty("--color", project.interactive.color);

document.querySelector(".background").setAttribute("src", project.page.backgroundImage);

document.querySelector(".title").textContent = project.name;
document.querySelector(".sd").textContent = project.description;
document.querySelector(".description p").textContent = project.page.description;
document.querySelector(".tech p").textContent = project.page.tech;
document.querySelector(".implementation-details p").textContent = project.page.implementationDetails;
document.querySelector(".content a").setAttribute("href", project.page.storeLink);