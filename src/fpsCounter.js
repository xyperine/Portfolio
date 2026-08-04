export class FPSCounter {
    #prevTime;
    #fpsElement;

    constructor() {
        this.#prevTime = performance.now();
        this.#fpsElement = document.querySelector("#fps-counter");
    }

    update() {
        const fps = 1000 / (performance.now() - this.#prevTime);
        this.#prevTime = performance.now();
        this.#fpsElement.textContent = `${Math.round(fps)} FPS`;
    }
}