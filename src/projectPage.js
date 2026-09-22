import * as yaml from "yaml";
import * as theme from "#src/theme.js";

// Get project id
const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

// Get project data
const response = await fetch("data/projects.yaml");
const text = await response.text();
const projects = yaml.parse(text).projects;

const project = projects[projectId];
if (!project) {
	document.body.textContent = "Project not found.";
	throw new Error(`Unknown project: ${projectId}`);
}

// Apply project data
document.title = `${project.name} | Arthur Mordvinov`;

document.body.style.setProperty("--color", project.color);

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

const mediaContainer = document.querySelector(".content .media");
const media = createMedia(project.page.media);
mediaContainer.appendChild(media);

function createMedia(mediaData) {
	switch (mediaData.type) {
		case "youtube":
			return createYoutube(mediaData.src);
		case "image":
			return createImage(mediaData.src, mediaData.alt);
		case "video":
			return createVideo(mediaData.src);
		default:
			return null;
	}
}

function createYoutube(src) {
	const iframe = document.createElement("iframe");
	iframe.src = src;
	iframe.title = "Project video";
	iframe.style.border = "none";
	iframe.allow = `
		accelerometer;
		autoplay;
		clipboard-write;
		encrypted-media;
		gyroscope;
		picture-in-picture;
		web-share;
	`;
	iframe.referrerPolicy = "strict-origin-when-cross-origin";
	iframe.allowFullscreen = true;

	return iframe;
}

function createImage(src, alt) {
	const img = document.createElement("img");
	img.src = src;
	img.alt = alt;

	return img;
}

function createVideo(src) {
	const video = document.createElement("video");
	video.src = src;
	video.title = "Project video";
	video.autoplay = true;
	video.muted = false;
	video.controls = HTMLFormControlsCollection;

	return video;
}

// Dark mode
theme.initializeDarkMode();
const darkModeSwitch = document.querySelector("#dark-mode-switch");
darkModeSwitch.addEventListener("click", (event) => {
	theme.toggleDarkMode();
	darkModeSwitch.textContent = theme.getDarkMode() ? "DARK" : "LIGHT";
});
darkModeSwitch.textContent = theme.getDarkMode() ? "DARK" : "LIGHT";
