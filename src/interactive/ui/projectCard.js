import { InputManager } from "#src/interactive/inputManager.js";

export class ProjectCard {
	/**
	 *
	 * @param {InputManager} inputManager
	 */
	static init(inputManager) {
		this.inputManager = inputManager;

		this.element = document.querySelector("#project-card");
		this.titleElement = document.querySelector("#project-card .title");
		this.metaTagElement = document.querySelector("#project-card .meta-tag");
		this.descriptionElement = document.querySelector(
			"#project-card .description",
		);
		this.coverElement = document.querySelector("#project-card img");
		this.learnElement = document.querySelector("#project-card .learn");
		this.closeElement = document.querySelector("#project-card .close");

		this.onElementFocused = (event) => {
			event.target.blur();
		};
		document.querySelectorAll("#project-card *").forEach((e) => {
			e.tabIndex = -1;
			e.addEventListener("focusin", this.onElementFocused);
		});

		this.mainElement = document.querySelector("main");

		this.onMouseClick = (event) => {
			event.stopPropagation();
		};
		this.element.addEventListener("click", this.onMouseClick);

		this.onCloseButtonClick = () => {
			this.hide();
		};
		this.closeElement.addEventListener("click", this.onCloseButtonClick);
	}

	static show(projectData) {
		this.inputManager.toUIMode();

		document.activeElement?.blur();

		this.titleElement.textContent = projectData.name;
		this.metaTagElement.textContent = projectData.metaTag;
		this.descriptionElement.textContent = projectData.description;
		this.coverElement.setAttribute("src", projectData.coverImage);
		this.learnElement.setAttribute("href", projectData.link);
		this.element.style.setProperty(
			"--color",
			projectData.interactive.color,
		);

		this.mainElement.style.pointerEvents = "none";
		this.element.classList.add("visible");
	}

	static hide() {
		this.inputManager.toGliderMode();

		this.mainElement.style.pointerEvents = "auto";
		this.element.classList.remove("visible");
	}

	static dispose() {
		this.hide();

		this.element.removeEventListener("click", this.onMouseClick);
		this.closeElement.removeEventListener("click", this.onCloseButtonClick);
		document.querySelectorAll("#project-card *").forEach((e) => {
			e.removeEventListener("focusin", this.onElementFocused);
		});
	}
}
