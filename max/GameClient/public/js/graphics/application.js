import {Vector2} from "./maths.js";

/**
 * @typedef {WebGL2RenderingContext & {shaders: {[shaderName: string]: Shader}, boundShader: Shader|null}} WebGL2RenderingContextWithShaders
 */

export class Application {
    /**
     * Create a new Application instance.
     * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
     */
    constructor(gl) {
        /**
         * The WebGL2 rendering context.
         * @type {WebGL2RenderingContextWithShaders}
         * @protected
         */
        this._gl = /** @type {WebGL2RenderingContextWithShaders} */ (gl);
        this._gl["shaders"] = {};
        this._gl["boundShader"] = null;

        /**
         * @type {Vector2}
         * @protected
         */
        this._mousePos = Vector2.zeros;
        /**
         * @type {Vector2}
         * @protected
         */
        this._mouseChange = Vector2.zeros;

        this._pressedButtons = new Set();
        this._pressedKeys = new Set();

        this._initialised = false;
    }

    /**
     * Add a shader to the application.
     * @param {string} name - The name of the shader.
     * @param {Shader} shader - The shader to add.
     * @returns {this}
     */
    addShader(name, shader) {
        this._gl["shaders"][name] = shader;
        shader.name = name;
        return this;
    }

    /**
     * Handle mouse movement.
     * @param {number} dx - The change in x position.
     * @param {number} dy - The change in y position.
     * @param {number} x - The absolute x position.
     * @param {number} y - The absolute y position.
     */
    onMouseMove(dx, dy, x, y) {
        const rect = this._gl.canvas.getBoundingClientRect();
        this._mousePos = new Vector2(x - rect.left, y - rect.top);
        this._mouseChange = new Vector2(dx, dy);
    }

    /**
     * Handle mouse button press
     * @param {number} button - The button pressed.
     */
    onMouseDown(button) {
        this._pressedButtons.add(button);
    }

    /**
     * Handle mouse button release
     * @param {number} button - The button released.
     */
    onMouseUp(button) {
        this._pressedButtons.delete(button);
    }

    /**
     * Handle key press
     * @param {string} key - The key pressed.
     */
    onKeyDown(key) {
        this._pressedKeys.add(key);
    }

    /**
     * Handle key release
     * @param {string} key - The key released.
     */
    onKeyUp(key) {
        this._pressedKeys.delete(key);
    }

    /**
     * Asynchronously initialise the application
     * @returns {Promise<this>}
     */
    async initialise() {
        if (this._initialised) throw Error("Already initialised.");
        this._initialised = true;
        return this;
    }

    /**
     * Update the application.
     * @protected
     */
    _update() {
        if (!this._initialised) throw Error("Not initialised.");
        this._mouseChange = Vector2.zeros;
    }

    /**
     * Draw the application.
     * @protected
     */
    _draw() {
        if (!this._initialised) throw Error("Not initialised.");
    }

    /**
     * Enter the Application's main loop.
     * @returns {this}
     */
    run() {
        let previousTime = 0;
        const app = this;

        function mainloop(currentTime) {
            if (previousTime === 0) previousTime = currentTime;

            const deltaTime = (currentTime - previousTime) / 1000;

            app._update(deltaTime);
            app._draw(deltaTime);

            previousTime = currentTime;
            requestAnimationFrame(mainloop);
        }

        requestAnimationFrame(mainloop);

        return this;
    }
}