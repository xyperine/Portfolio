export class Interactables {
	static #items;

	static init() {
		this.#items = new Set();
	}

	static register(interactable) {
		this.#items.add(interactable);
	}

	static unregister(interactable) {
		this.#items.delete(interactable);
	}

	static get items() {
		return [...this.#items];
	}

	static dispose() {
		this.#items.clear();
	}
}
