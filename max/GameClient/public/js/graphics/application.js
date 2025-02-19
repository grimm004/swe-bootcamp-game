import {Vector2} from "./maths.js";


export class Application {
    /**
     * @param {WebGL2RenderingContext} gl
     */
    constructor(gl) {
        this.gl = gl;
        this.gl["shaders"] = {};
        this.gl["boundShader"] = null;

        /**
         * @type {Vector2}
         */
        this.mousePos = Vector2.zeros;
        /**
         * @type {Vector2}
         */
        this.mouseChange = Vector2.zeros;

        this.pressedButtons = new Set();
        this.pressedKeys = new Set();

        this.initialised = false;
    }

    addShader(name, shader) {
        this.gl["shaders"][name] = shader;
        shader.name = name;
        return this;
    }

    mouseMove(dx, dy, x, y) {
        const rect = this.gl.canvas.getBoundingClientRect();
        this.mousePos = new Vector2(x - rect.left, y - rect.top);
        this.mouseChange = new Vector2(dx, dy);
    }

    mouseDown(button) {
        this.pressedButtons.add(button);
    }

    mouseUp(button) {
        this.pressedButtons.delete(button);
    }

    keyDown(key) {
        this.pressedKeys.add(key);
    }

    keyUp(key) {
        this.pressedKeys.delete(key);
    }

    isKeyDown(key) {
        return this.pressedKeys.has(key);
    }

    isKeyUp(key) {
        return !this.isKeyDown(key);
    }

    isButtonDown(key) {
        return this.pressedButtons.has(key);
    }

    isButtonUp(key) {
        return !this.isButtonDown(key);
    }

    async initialise() {
        this.initialised = true;
        return this;
    }

    update() {
        if (!this.initialised) throw Error("Not initialised.");
        this.mouseChange = Vector2.zeros;
    }

    draw() {
        if (!this.initialised) throw Error("Not initialised.");
    }

    run() {
        let previousTime = 0;
        const app = this;

        function mainloop(currentTime) {
            if (previousTime === 0) previousTime = currentTime;

            const deltaTime = (currentTime - previousTime) / 1000;

            app.update(deltaTime);
            app.draw(deltaTime);

            previousTime = currentTime;
            requestAnimationFrame(mainloop);
        }

        requestAnimationFrame(mainloop);
    }
}