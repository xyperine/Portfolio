const STORAGE_KEY = "darkMode";

export function getDarkMode() {
	return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setDarkMode(enabled) {
	document.documentElement.classList.toggle("dark", enabled);
	localStorage.setItem(STORAGE_KEY, enabled);
}

export function toggleDarkMode() {
	setDarkMode(!getDarkMode());
}

export function initializeDarkMode() {
	setDarkMode(getDarkMode());
}
